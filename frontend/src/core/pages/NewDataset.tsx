import React, { useState, useEffect } from "react";
import EnumEditor from "./EnumEditor";
import { useNavigate } from "react-router-dom";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { Button } from "@/core/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Loader2 } from "lucide-react";
import { ENDPOINTS } from "@/config";
import { authHeaders } from "@/core/utils/auth";

interface DatasetSchema {
  name: string;
  description: string;
  schema_definition: {
    type: string;
    required?: string[];
    properties: Record<string, any>;
  };
}

const NewDataset: React.FC = () => {
  // ... existing state

  // Track done state per enum field
  const [enumDone, setEnumDone] = useState<Record<string, boolean>>({});

  // Helper: check if all category setups are valid and all Done clicked
  function isCategorySetupComplete(): boolean {
    if (!selectedSchemaObj) return true;
    const enumFields = Object.entries(selectedSchemaObj.schema_definition.properties)
      .filter(([key, value]: [string, any]) => value.type === 'string' && Array.isArray(value.enum));
    for (const [key, value] of enumFields) {
      const vals: string[] = enumEdits[key] || value.enum;
      if (!vals || vals.length === 0) return false;
      const trimmed = vals.map(v => v.trim()).filter(Boolean);
      if (trimmed.length !== vals.length) return false;
      const unique = new Set(trimmed);
      if (unique.size !== trimmed.length) return false;
      if (!enumDone[key]) return false;
    }
    return true;
  }
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [schemas, setSchemas] = useState<DatasetSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSchemas, setIsFetchingSchemas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchemas();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (schemas.length > 0 && !selectedSchema) {
      setSelectedSchema(schemas[0].name);
    }
  }, [schemas, selectedSchema]);

  const fetchSchemas = async () => {
    setIsFetchingSchemas(true);
    try {
      const response = await fetch(ENDPOINTS.DATASET_SCHEMAS, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch schemas: ${response.statusText}`);
      }
      const data = await response.json();
      setSchemas(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch schemas");
    } finally {
      setIsFetchingSchemas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const schema = schemas.find((s) => s.name === selectedSchema);
      if (!schema) throw new Error("Schema not selected");
      const response = await fetch(ENDPOINTS.DATASETS, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          schema_name: schema.name,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create dataset: ${response.statusText}`);
      }
      // Optionally get dataset id and redirect
      navigate("/datasets");
    } catch (err: any) {
      setError(err.message || "Failed to create dataset");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSchemaObj = schemas.find((s) => s.name === selectedSchema);

  // Local state for editable enums per field
  const [editingEnumField, setEditingEnumField] = useState<string | null>(null);
  const [enumEdits, setEnumEdits] = useState<Record<string, string[]>>({});

  let sortedFields: [string, any][] = [];
  if (selectedSchemaObj) {
    const requiredSet = new Set(selectedSchemaObj.schema_definition.required || []);
    sortedFields = Object.entries(selectedSchemaObj.schema_definition.properties)
      .sort(([aKey, aVal], [bKey, bVal]) => {
        const aReq = requiredSet.has(aKey) || aVal.required;
        const bReq = requiredSet.has(bKey) || bVal.required;
        if (aReq === bReq) return 0;
        return aReq ? -1 : 1;
      });
  }

  // Get enum values, prefer edits if present
  function getEnumValues(key: string, value: any): string[] | undefined {
    if (enumEdits[key]) return enumEdits[key];
    if (Array.isArray(value.enum)) return value.enum;
    return undefined;
  }

  // Helper to render type string
  function renderType(value: any): string {
    if (value.type === 'array') {
      return 'string[]';
    }
    if (value.type === 'object') {
      return 'json';
    }
    return value.type || 'json';
  }

  return (
    <div className="max-w-7xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-8">Create New Dataset</h1>
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Name, Description, Save */}
        <form onSubmit={handleSubmit} className="flex-[1.25] min-w-[380px] space-y-8 bg-white rounded-2xl shadow-lg p-10">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading || !isCategorySetupComplete()}>
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Create Dataset"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/datasets")}>Cancel</Button>
          </div>
        </form>

        {/* Right: Schema Dropdown + Table */}
        <div className="flex-[1.25] min-w-[380px]">
          <Label htmlFor="schema" className="mb-2 block">Dataset Schema</Label>
          <Select value={selectedSchema} onValueChange={setSelectedSchema} required>
            <SelectTrigger id="schema">
              <SelectValue placeholder={isFetchingSchemas ? "Loading..." : "Select a schema"} />
            </SelectTrigger>
            <SelectContent>
              {schemas.map((schema) => (
                <SelectItem key={schema.name} value={schema.name}>
                  <span className="font-medium">{schema.name}</span> - <span className="text-xs text-gray-500">{schema.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Enum editing section above schema columns */}
          {selectedSchemaObj && (() => {
            const enumFields = Object.entries(selectedSchemaObj.schema_definition.properties)
              .filter(([key, value]: [string, any]) => value.type === 'string' && Array.isArray(value.enum));
            if (enumFields.length === 0) return null;
            return (
              <div className="mt-10 mb-10 flex rounded-2xl shadow-lg border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                <div className="w-2 rounded-l-2xl bg-indigo-500" />
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-lg font-bold text-indigo-800">Category Setup</span>
                  </div>
                  <div className="text-sm text-indigo-700 mb-4">This schema requires you to define the allowed categories to classify the image.</div>
                  <div className="divide-y divide-indigo-100">
                    {enumFields.map(([key, value]: [string, any], idx) => (
                      <div key={key} className={"py-4 flex flex-col md:flex-row md:items-center md:gap-6" + (idx === 0 ? " pt-0" : "") }>
                        <span className="inline-flex items-center gap-2 font-semibold text-indigo-700 text-base min-w-[120px] bg-indigo-100/80 rounded-full px-4 py-1 mr-3 mb-2 md:mb-0">
                          <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V7h2v2z" /></svg>
                          {key}
                        </span>
                        <div className="flex-1">
                          {enumDone[key] ? (
                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                              <div className="flex flex-wrap gap-2">
                                {(enumEdits[key] || value.enum).map((cat, i) => (
                                  <span key={cat + i} className="inline-block bg-green-200 text-green-800 rounded-full px-3 py-0.5 text-xs font-semibold cursor-default select-none">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs px-2 py-0.5 border-green-400 text-green-700 hover:bg-green-100 ml-2"
                                onClick={() => setEnumDone(done => ({ ...done, [key]: false }))}
                              >Edit</Button>
                            </div>
                          ) : (
                            <EnumEditor
                              values={enumEdits[key] || value.enum}
                              onChange={vals => {
                                setEnumEdits(edits => ({ ...edits, [key]: vals }));
                                setEnumDone(done => ({ ...done, [key]: false }));
                              }}
                              onDone={() => setEnumDone(done => ({ ...done, [key]: true }))}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedSchemaObj && (
            <div className="border rounded-2xl p-8 bg-white shadow-lg mt-8">
              <h2 className="font-semibold mb-4 text-lg flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-blue-500 rounded-sm mr-2"></span>
                <span className="text-lg font-bold text-blue-800">Schema Columns</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-4 py-2 font-bold text-base">Field</th>
                      <th className="text-left px-4 py-2 font-bold text-base">Type</th>
                      <th className="text-left px-4 py-2 font-bold text-base">Description</th>
                      <th className="text-left px-4 py-2 font-bold text-base">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFields.map(
                      ([key, value], idx) => {
                        const isRequired = (selectedSchemaObj.schema_definition.required || []).includes(key) || value.required;
                        return (
                          <tr
                            key={key}
                            className={
                              idx % 2 === 0
                                ? "bg-gray-50 hover:bg-blue-50 transition"
                                : "bg-white hover:bg-blue-50 transition"
                            }
                          >
                            <td className="px-4 py-2 font-mono text-sm text-blue-900">{key}</td>
                            <td className="px-4 py-2">
                              <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                                {value.type === 'string' && getEnumValues(key, value)
                                  ? 'string'
                                  : renderType(value)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">{value.description}</td>
                            <td className="px-4 py-2">
                              {isRequired ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">Yes</span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-600">No</span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewDataset;
