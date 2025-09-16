import React from 'react';

export default function Tabs({ value, onChange, items }){
  const ids = items.map((_,i)=>`tab-${i}`);
  return (
    <div className="tabs">
      <div className="tablist" role="tablist" aria-label="Sections">
        {items.map((it, i) => (
          <button
            key={i}
            id={ids[i]}
            role="tab"
            className={`tab ${value===i?'active':''}`}
            aria-selected={value===i}
            aria-controls={`${ids[i]}-panel`}
            tabIndex={value===i?0:-1}
            onClick={()=> onChange(i)}
          >{it.label}</button>
        ))}
      </div>
      {items.map((it, i) => (
        <div key={i} id={`${ids[i]}-panel`} role="tabpanel" aria-labelledby={ids[i]} hidden={value!==i}>
          {value===i && it.content}
        </div>
      ))}
    </div>
  );
}

