import { useState } from "react";

export default function Dropdown({ options, selected, setSelected }) {
  const [open, setOpen] = useState(false);

  const toggleSelection = (option) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  return (
    <div className="dropdown">
      <button onClick={() => setOpen(!open)} className="dropdown-btn">Exclude ▼</button>
      {open && (
        <div className="absolute mt-2 bg-white border rounded-lg shadow-lg p-2 w-48">
          {options.map((option) => (
            <label key={option} className="dropdown-option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleSelection(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
