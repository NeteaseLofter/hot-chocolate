import React, { useEffect } from 'react'
import {
  manager
} from './manager';
import { useLocation } from 'react-router-dom'


function VueApplication() {
    let location = useLocation();
    console.log(location.pathname);
    useEffect(()=>{
        if (location.pathname === '/both')
        {
          manager.deactivateAll()
          manager.activateAndMount('app1', document.body);
          manager.activateAndMount('app2', document.body);
        }
        
    },[location.pathname])
   
    return (
        <div>两个子应用都展示</div>
    );
}

export default VueApplication