import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

import prescreenJson from '@/components/survey/prescreen.json';

export default function SurveyEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [surveyModel, setSurveyModel] = useState<Model | null>(null);

    useEffect(() => {
        const role = getRole();
        const employeeId = getEmployeeId();
        const token = getAuthToken();

        fetch(`/api/surveys/${id}`, {
            headers: {
                "x-user-role": role,
                "x-employee-id": employeeId,
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const model = new Model(prescreenJson);

                // Collect prescreen question names
                const prescreenQuestions = model.getAllQuestions().map((q: any) => q.name);

                // Clean out "N/A" placeholders (for only prescreen questions) so survey shows unanswered question fields as empty
                const cleanedResponses = Object.fromEntries(
                    Object.entries(data.responses || {}).map(([key, value]) => [
                        key,
                        prescreenQuestions.includes(key) && value === "N/A" ? null : value
                    ])
                );

                // Pre-fill the survey with cleaned existing responses
                model.data = cleanedResponses;

                model.onComplete.add(async (sender) => {
                    const updatedPrescreen = sender.data;
                    
                    console.log("Updated prescreen: ", updatedPrescreen);

                    const consent = updatedPrescreen.consent_given;

                    // If consent is revoked, call DELETE survey from backend
                    // INCOMPLETE - tested delete endpoint from Backend PR #56 and it wasn't working
                    // ^ When testing, kept getting error 500
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

                    // If consent is NOT revoked, proceed by replacing prescreen responses: 
                    const prescreenNames = sender
                        .getAllQuestions()
                        .filter((q: any) => q.getType() !== "html")
                        .map((q: any) => q.name);

                    // Copy of all survey answers from db (prescreen + main survey)
                    const prevResponses = { ...(data.responses || {}) };
                    console.log("Existing responses from DB (before):", prevResponses);

                    // Delete original prescreen answers from copy
                    for (const name of prescreenNames) {
                        if (name in prevResponses) delete prevResponses[name];
                    }

                    // Merge OG non-prescreen + updated prescreen responses
                    const updatedResponses = {
                        ...updatedPrescreen,
                        ...prevResponses
                    };
                    console.log("Final merged responses: ", updatedResponses);

                    // Ensure unanswered prescreen responses are saved as "N/A" again
                    prescreenNames.forEach(name => {
                        if (!(name in updatedResponses) || updatedResponses[name] == null) {
                            updatedResponses[name] = "N/A";
                        }
                    });

                    // Updates survey prescreen responses via PUT
                    const res = await fetch(`/api/surveys/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "x-user-role": role,
                            "x-employee-id": employeeId,
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            _id: data._id,
                            responses: updatedResponses
                        }),
                    });

                    if (res.ok) {
                        navigate(`/survey/${id}`);
                    } else {
                        console.error("Failed to update survey.");
                    }
                });

                setSurveyModel(model);
            });
    }, [id, navigate]);

    if (!surveyModel) return <div>Loading...</div>;

    return <Survey model={surveyModel} />;
}