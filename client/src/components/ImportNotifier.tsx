import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// TypeScript type for the import response
export interface ImportResponse {
  failed: number;
  message: string;
  guidance?: string;
  actionSteps?: string[];
  errors?: string[];
  missingVendors?: string[];
  missingCategories?: string[];
}

function renderMissingList(title: string, items: string[]) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <strong>{title}:</strong>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {items.map((item, idx) => (
          <li key={item + idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ImportNotifier() {
  // Call this function with your API response after an import attempt
  const handleImportResponse = (response: ImportResponse) => {
    const { message, guidance, actionSteps, errors, missingVendors, missingCategories } = response;

    // Ensure missingVendors and missingCategories are always arrays
    const vendors = Array.isArray(missingVendors) ? missingVendors : [];
    const categories = Array.isArray(missingCategories) ? missingCategories : [];

    toast(
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{message}</div>
        {guidance && <div style={{ marginBottom: 4 }}>{guidance}</div>}
        {Array.isArray(actionSteps) && actionSteps.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <strong>Action Steps:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {actionSteps.map((step, idx) => (
                <li key={step + idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}
        {renderMissingList('Missing Vendors', vendors)}
        {renderMissingList('Missing Categories', categories)}
        {Array.isArray(errors) && errors.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer' }}>Show error details</summary>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((err, idx) => (
                <li key={err + idx}>{err}</li>
              ))}
            </ul>
          </details>
        )}
      </div>,
      {
        autoClose: false,
        type: response.failed > 0 ? 'error' : 'success',
        style: { minWidth: 350, maxWidth: 500 }
      }
    );
  };

  // Helper to escape HTML for safe rendering
  function escapeHtml(text: string): string {
    return text.replace(/[&<>'"]/g, (char) => {
      switch (char) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return char;
      }
    });
  }

  // Export the handler for use elsewhere
  (ImportNotifier as unknown as { handleImportResponse: (r: ImportResponse) => void }).handleImportResponse = handleImportResponse;

  // Place <ToastContainer /> once globally in your app
  return <ToastContainer position="top-right" autoClose={10000} />;
}
