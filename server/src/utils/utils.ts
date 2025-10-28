import Survey from "@/database/survey/mongoose/survey.model";

export async function getLatestLocation(userObjectId: string) {
    const latestSurvey = await Survey.findOne({ createdByUserObjectId: userObjectId }).sort({ updatedAt: -1 });
    return latestSurvey?.locationObjectId;
}