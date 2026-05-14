import React from 'react';
import RequestRoleItem from "./RequestRoleItem";

const RequestRoleList = ({ request }) => {
    if (!request || request.length === 0) {
        return <p className="mod-edu-empty">Нет заявок на рассмотрении.</p>;
    }

    return (
        <div className="mod-group">
            <div className="mod-group__header">
                <span className="mod-group__dot mod-group__dot--request" />
                Заявки
                <span className="mod-group__count">{request.length}</span>
            </div>
            {request.map((item) => (
                <RequestRoleItem key={item.id} request={item} />
            ))}
        </div>
    );
};

export default RequestRoleList;
