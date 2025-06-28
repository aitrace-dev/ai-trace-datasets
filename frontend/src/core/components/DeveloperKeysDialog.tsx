import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Copy, Trash2 } from "lucide-react";
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

interface APIKeyPreview {
  id: string;
  api_key_preview: string;
  created_at: string;
}

interface APIKeyCreateResponse {
  id: string;
  api_key: string;
  api_key_preview: string;
  created_at: string;
}

const DeveloperKeysDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [apiKeys, setApiKeys] = useState<APIKeyPreview[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<{ key: string; idx: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(ENDPOINTS.KEY_MANAGEMENT, { headers: authHeaders() })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load API keys");
        return r.json();
      })
      .then(setApiKeys)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleCopy = (idx: number, key?: string) => {
    const val = key || apiKeys[idx]?.api_key_preview;
    if (val) navigator.clipboard.writeText(val);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const resp = await fetch(ENDPOINTS.KEY_MANAGEMENT, { method: "POST", headers: authHeaders() });
      if (!resp.ok) throw new Error("Failed to create API key");
      const data: APIKeyCreateResponse = await resp.json();
      setApiKeys(keys => [{ id: data.id, api_key_preview: data.api_key_preview, created_at: data.created_at }, ...keys]);
      setShowKey({ key: data.api_key, idx: 0 });
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (idx: number) => {
    const key = apiKeys[idx];
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${ENDPOINTS.KEY_MANAGEMENT}/delete/${key.id}`, { method: "DELETE", headers: authHeaders() });
      if (!resp.ok) throw new Error("Failed to delete API key");
      setApiKeys(keys => keys.filter((_, i) => i !== idx));
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Developer API Keys</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              {apiKeys.length === 0 && <div className="text-muted-foreground text-sm">No API keys found.</div>}
              {apiKeys.map((k, idx) => (
                <div key={k.id} className="flex items-center gap-2 bg-muted rounded px-3 py-2">
                  <Input
                    type="text"
                    value={showKey && showKey.idx === idx ? showKey.key : k.api_key_preview}
                    readOnly
                    className="font-mono text-xs bg-transparent border-none p-0 flex-1"
                    style={{ letterSpacing: "0.05em" }}
                    onFocus={e => e.target.select()}
                  />
                  <span className="text-xs text-muted-foreground mr-2">{new Date(k.created_at).toLocaleString()}</span>
                  {showKey && showKey.idx === idx ? (
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(idx, showKey.key)}>
                      <Copy className="w-4 h-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(idx)} disabled={loading}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                  {copiedIdx === idx && <span className="text-green-600 text-xs ml-1">Copied!</span>}
                  {showKey && showKey.idx === idx && (
                    <span className="text-xs bg-green-100 text-green-800 rounded px-2 ml-2">Save this key now!</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleCreate} disabled={creating || loading}>
              {creating ? "Creating..." : "Create New API Key"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperKeysDialog;
