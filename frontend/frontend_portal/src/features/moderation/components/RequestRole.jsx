import React, { useEffect, useState } from 'react';
import Loader from "../../../components/UI/loader/loader";
import AccountService from "../../account/API/AccountService";
import RequestRoleList from "./RequestRoleList";

const RequestRole = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const response = await AccountService.RequestRoleList();
                const data = response.data;
                setRequests(Array.isArray(data) ? data : (data?.results ?? []));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (loading) return <Loader />;

    return <RequestRoleList request={requests} />;
};

export default RequestRole;
