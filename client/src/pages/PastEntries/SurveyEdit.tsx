import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";

import prescreenJson from '@/components/survey/prescreen.json';
import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

/*
SurveyEdit allows editing of a completed survey’s prescreen responses.
It fetches the survey data from the backend using the survey ID from the URL.
Then it loads prescreen survey JSON template (from prescreen.json) into a SurveyJS model.
Prefills the survey model with existing survey responses, cleaning out "N/A" placeholders.
On submit:
  - If consent is revoked (consent_given = 'No'), the survey responses are (mostly) deleted from the backend.
  - If consent is retained, prescreen responses are updated and saved via PUT.
*/
export default function SurveyEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [surveyModel, setSurveyModel] = useState<Model | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const role = getRole();
                const employeeId = getEmployeeId();
                const token = getAuthToken();

                const res = await fetch(`/api/surveys/${id}`, {
                    headers: {
                        "x-user-role": role,
                        "x-employee-id": employeeId,
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    if (res.status == 404) alert("Survey not found.");
                    else if (res.status == 403) alert("You do not have permission to view this survey.");
                    else alert("Failed to load survey due to server error.");
                    return;
                }

                const data = await res.json();
                const model = new Model(prescreenJson);

                // Extract all prescreen question names from the form JSON
                const prescreenQuestions = model.getAllQuestions().map((q: any) => q.name);

                // Replace "N/A" placeholders with null for prescreen questions
                // Unanswered prescreen questions show as blank in the UI
                const cleanedResponses = Object.fromEntries(
                    Object.entries(data.responses || {}).map(([key, value]) => [
                        key,
                        prescreenQuestions.includes(key) && value === "N/A" ? null : value
                    ])
                );

                // Pre-fill survey model with cleaned existing responses
                model.data = cleanedResponses;

                // Handle completing survey edits: 
                model.onComplete.add(async (sender) => {
                    const updatedPrescreen = sender.data;
                    const consent = updatedPrescreen.consent_given; // grabs answer to consent question

                    // If consent is revoked, delete survey via DELETE API call
                    if (consent === 'No') {
                        try {
                            const res = await fetch(`/api/surveys/${id}`, {
                                method: 'DELETE',
                                headers: {
                                    "x-user-role": role,
                                    "x-employee-id": employeeId,
                                    Authorization: `Bearer ${token}`
                                }
                            });

                            if (res.ok) {
                                console.log("Survey deleted due to revoked consent.");
                                alert("Survey deleted due to revoked consent.");
                                navigate('/past-entries');
                            } else {
                                const errorMessage = await res.json();
                                console.error("Failed to delete survey: ", errorMessage);
                            }

                        } catch (err) {
                            console.error("Error deleting survey: ", err);
                        }
                        return;
                    }

                    // If consent is NOT revoked, update prescreen responses: 
                    const prescreenNames = sender
                        .getAllQuestions()
                        .filter((q) => q.hasInput) // omit elements that don't have input (e.g. html text)
                        .map((q) => q.name);

                    // Copy of all survey answers from db (prescreen + main survey)
                    const prevResponses = { ...(data.responses || {}) };

                    // Delete original prescreen answers from copy (to overwrite them cleanly)
                    prescreenNames.forEach((name) => delete prevResponses[name]);

                    // Merge OG non-prescreen + updated prescreen responses
                    const updatedResponses = {
                        ...updatedPrescreen,
                        ...prevResponses
                    };

                    // Refill unanswered prescreen responses with "N/A"
                    prescreenNames.forEach(name => {
                        if (!(name in updatedResponses) || updatedResponses[name] == null) {
                            updatedResponses[name] = "N/A";
                        }
                    });

                    // Updates survey prescreen responses via PUT request
                    const res = await fetch(`/api/surveys/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "x-user-role": role,
                            "x-employee-id": employeeId,
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            responses: updatedResponses
                        }),
                    });

                    if (res.ok) {
                        console.log("Succesfully updated survey!");
                        navigate(`/survey/${id}`);
                    } else {
                        console.error("Failed to update survey.");
                    }
                });

                setSurveyModel(model);

            } catch (err: any) {
                alert(err.message || "Failed to load survey.");
            } finally {
                setLoading(false);
            }
        };

        fetchSurvey();
    }, [id, navigate]);

    if (loading) return <div>Loading survey...</div>;

    // Render survey editing UI with SurveyJS
    return <Survey model={surveyModel} />;
}