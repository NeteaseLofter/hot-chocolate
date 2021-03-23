import React, { useEffect } from 'react'
import {
    manager
} from './manager';
import { useLocation } from 'react-router-dom'



//  manager.activateAndMount('app2', document.body);
// manager.findOrActivate('app1')
// manager.deactivateAll('app2')
function ReactApplicationAnother() {
    let location = useLocation();
    console.log(location.pathname);
    useEffect(()=>{
        if (location.pathname === '/react16')
        {
            manager.deactivateAll()
            manager.activateAndMount('app3', document.body);
        }
        
    },[location.pathname])
   
    return (
        <div>跳转到React子应用</div>
    );
}

export default ReactApplicationAnother