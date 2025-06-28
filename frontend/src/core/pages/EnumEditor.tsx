import React, { useState, useRef, useEffect } from "react";

interface EnumEditorProps {
  values: string[];
  onChange: (values: string[]) => void;
  onDone: () => void;
}

const EnumEditor: React.FC<EnumEditorProps> = ({ values, onChange, onDone }) => {
  const [local, setLocal] = useState<string[]>(values);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (editingIdx !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIdx]);

  const handleRemove = (idx: number) => {
    if (local.length <= 1) {
      setError("At least one category is required");
      return;
    }
    setError(null);
    const updated = local.filter((_, i) => i !== idx);
    setLocal(updated);
    onChange(updated);
    setEditingIdx(null);
  };

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Category cannot be empty");
      return;
    }
    if (local.includes(trimmed)) {
      setError("Category already exists");
      return;
    }
    setError(null);
    const updated = [...local, trimmed];
    setLocal(updated);
    onChange(updated);
    setInput("");
    if (inputRef.current) inputRef.current.focus();
  };

  const startEdit = (idx: number, value: string) => {
    setEditingIdx(idx);
    setEditValue(value);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditValue("");
    setError(null);
  };

  const finishEdit = (idx: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError("Category cannot be empty");
      return;
    }
    if (local.some((v, i) => v === trimmed && i !== idx)) {
      setError("Duplicate category");
      return;
    }
    setError(null);
    const updated = [...local];
    updated[idx] = trimmed;
    setLocal(updated);
    onChange(updated);
    setEditingIdx(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Enter") finishEdit(idx);
    if (e.key === "Escape") cancelEdit();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setInput("");
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {local.map((val, idx) => (
        <span key={val + idx} className="inline-flex items-center bg-indigo-100 rounded px-2 py-0.5">
          {editingIdx === idx ? (
            <input
              ref={editInputRef}
              className="w-20 bg-transparent border-b border-indigo-400 focus:outline-none focus:border-indigo-600 text-xs mr-1 px-1"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => finishEdit(idx)}
              onKeyDown={e => handleEditKeyDown(e, idx)}
            />
          ) : (
            <>
              <span
                className="cursor-pointer px-1"
                onClick={() => startEdit(idx, val)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') startEdit(idx, val); }}
              >{val}</span>
              <button
                type="button"
                className="ml-1 text-red-500 hover:text-red-700 text-xs"
                onClick={() => handleRemove(idx)}
                title="Remove"
                disabled={local.length <= 1}
              >
                ×
              </button>
            </>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        className="border border-indigo-200 rounded px-1 py-0.5 text-xs w-20"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Add"
      />
      <button
        type="button"
        className="ml-2 text-green-600 hover:text-green-800 text-xs border px-2 py-0.5 rounded"
        onClick={handleAdd}
      >
        Add
      </button>
      <button
        type="button"
        className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
        onClick={onDone}
      >
        Done
      </button>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default EnumEditor;
