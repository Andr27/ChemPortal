import React from 'react';
import MySelect from "../../../components/UI/select/MySelect";

const PostFilter = ({filter, setFilter}) => {
    return (
        <div>
            <MySelect
                value={filter.sort}
                onChange={selectedSort => setFilter({...filter, sort: selectedSort})}
                defaultValue = "Сортировка"
                options={[
                    {value: "title", name: "По названию"},
                    {value: "body", name: "По описанию"},
                ]}
            />
        </div>
    );
};

export default PostFilter;