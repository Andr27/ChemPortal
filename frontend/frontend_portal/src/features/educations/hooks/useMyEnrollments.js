import { useEffect, useState } from "react";
import EducationService from "../API/EducationService";

export const useMyEnrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMyEnrollments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await EducationService.getMyEnrollments();
            const data = response.data;
            const list = Array.isArray(data) ? data : (data?.results ?? []);
            setEnrollments(list);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyEnrollments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        enrollments,
        isLoading,
        error,
        refetch: fetchMyEnrollments,
    };
};

