import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import prescreenJson from '@/pages/PastEntries/prescreen.json';
import { getEmployeeId, getRole } from "@/utils/authTokenHandler";

export default function SurveyEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [surveyModel, setSurveyModel] = useState<Model | null>(null);

    useEffect(() => {
        const employeeId = getEmployeeId();
        const role = getRole();

        fetch(`/api/surveys/${id}`, {
            headers: {
                "x-user-role": role,
                "x-employee-id": employeeId
            }
        })
            .then(res => res.json())
            .then(data => {
                const model = new Model(prescreenJson);
                // Pre-fill the survey with existing responses
                model.data = data.responses;

                // When survey is completed:
                model.onComplete.add(async (sender) => {
                    const updatedPrescreen = sender.data;
                    console.log("Updated prescreen: ", updatedPrescreen);

                    const consent = updatedPrescreen.consent_given;

                    // If consent is revoked, call delete survey from backend (not created yet)
                    // Incomplete
                    if (consent === 'No') {
                        const res = await fetch(`/api/surveys/${id}/somethingsomething`);

                        if (res.ok) {
                            console.log("Survey deleted due to revoked consent.");
                            navigate('/past-entries');
                        } else {
                            console.error("Failed to delete survey.");
                        }
                        return;
                    }

                    // If consent is not revoked, proceed as normal: 

                    const prescreenNames = sender
                        .getAllQuestions()
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

                    // Updates survey prescreen responses via PUT (not created in backend yet)
                    const res = await fetch(`/api/surveys/${id}/edit-prescreen`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "x-user-role": role,
                            "x-employee-id": employeeId,
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
    }, [id]);

    if (!surveyModel) return <div>Loading...</div>;

    return <Survey model={surveyModel} />;
}