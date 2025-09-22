import { useEffect, useState } from 'react';
import axios from 'axios';

const useRole = (userEmail) => {
    const [role, setRole] = useState(null); // Default to null indicating it's undetermined
    const [loading, setLoading] = useState(true); // Start loading as true

    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            setRole(null);
            return;
        }

        const fetchRole = async () => {
            setLoading(true); // Begin loading when fetching starts
            try {
                const response = await axios.get(`/api/role`, {
                    params: { email: userEmail },
                });
                setRole(response.data?.role || null);  // If no role is found, set it to null
            } catch (error) {
                console.error('Error fetching user role:', error);
                setRole(null);  // In case of an error, set role to null
            } finally {
                setLoading(false);  // Always stop loading after fetching is done
            }
        };

        fetchRole();
    }, [userEmail]);

    return { role, loading };
};

export default useRole;
