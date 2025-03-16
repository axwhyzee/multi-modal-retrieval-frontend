import { useState, useEffect } from "react";
import { get_obj_url, list_objs } from "./utils";
import "./app.css";


function List() {
    /*  
    GUI to see storage objects.
    This component is for debugging using the frontend.
    */

    const [objs, setObjs] = useState([]);

    useEffect(() => {
        async function initObjs() {
            const all_keys = await list_objs();
            const valid_keys = [];
            for (let i=0; i<all_keys.length; i++) {
                if (all_keys[i].indexOf(".") !== -1) {
                    valid_keys.push(get_obj_url(all_keys[i]));
                }
            }
            valid_keys.sort();
            setObjs(valid_keys);
        }
        initObjs();
    }, []) 

    return (
        <div>
            {objs && objs.map((key, i) => (
                <div>
                    <a href={key} target="_">{key}</a>
                </div>
            ))}
        </div>
    )
}
export default List;