import React from 'react';
import Myinput from "../../../../components/UI/input/Myinput";

const CoursesFilter = ({ filter, setFilter }) => {
    return (
        <div>
            <Myinput
                type="search"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
                placeholder="Поиск по курсам..."
            />
        </div>
    );
};

export default CoursesFilter;
