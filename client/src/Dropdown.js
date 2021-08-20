import React, {useState} from 'react'

function Dropdown({onSelect, activeItem, items}){
    const [dropDownVisible, setDropDownVisisble] = useState(false)

    const selectItem = (e, item) =>{
        e.preventDefault()
        setDropDownVisisble(!dropDownVisible)
        onSelect(item)
    }
     return(
        <div className="dropdown ml-3">
            <button className= 'btn btn-secondary dropdown-toggle' type="button" id="triggerId" data-toggle="dropdown" 
                onClick={() => setDropDownVisisble(!dropDownVisible)}>
               {activeItem.label}
            </button>
            <div className={`dropdown-menu ${dropDownVisible? 'visible' : ''}`}  aria-labelledby="triggerId">
                {items && items.map((item,i) => 
                 <a className={`dropdown-item 
                 ${item.value === activeItem.value? 'active': null}`} href="#" 
                  onClick = {e => selectItem(e,item.value)} key ={i}>
                     {item.label}</a>)}
            </div>
        </div>
     )
}
export default Dropdown
