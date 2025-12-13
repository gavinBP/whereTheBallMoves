import { useState } from 'react';
import type { ErrorReport } from '../../types/errors';
import { format } from 'date-fns';

interface ErrorReportProps {
  errorReport: ErrorReport | null;
  onClose?: () => void;
}

/**
 * Component for displaying error report
 */
export function ErrorReportComponent({ errorReport, onClose }: ErrorReportProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!errorReport) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Error Report Button/Badge */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: errorReport.totalErrors > 0 ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>
          {errorReport.totalErrors > 0
            ? `⚠️ ${errorReport.totalErrors} Error${errorReport.totalErrors !== 1 ? 's' : ''}`
            : '✓ No Errors'}
        </span>
      </button>

      {/* Error Report Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleClose}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflowY: 'auto',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, color: '#333' }}>Error Report</h2>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* Summary */}
            <div
              style={{
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                color: '#333333',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#333333' }}>
                <div>
                  <strong>Total Errors:</strong> {errorReport.totalErrors}
                </div>
                <div>
                  <strong>Data File Errors:</strong> {errorReport.dataFileErrors.length}
                </div>
                <div>
                  <strong>Track Errors:</strong> {errorReport.trackErrors.length}
                </div>
                <div>
                  <strong>API Errors:</strong> {errorReport.apiErrors.length}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Last Successful Fetch:</strong>{' '}
                  {errorReport.lastSuccessfulFetch
                    ? format(errorReport.lastSuccessfulFetch, 'MMM dd, yyyy HH:mm:ss')
                    : 'Never'}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Report Generated:</strong>{' '}
                  {format(errorReport.generatedAt, 'MMM dd, yyyy HH:mm:ss')}
                </div>
              </div>
            </div>

            {/* Data File Errors */}
            {errorReport.dataFileErrors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>Data File Errors</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {errorReport.dataFileErrors.map((error, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '4px',
                        color: '#333333',
                      }}
                    >
                      <div style={{ color: '#333333' }}>
                        <strong>Hour {error.hour < 10 ? `0${error.hour}` : error.hour}.json:</strong>{' '}
                        {error.error}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {format(error.timestamp, 'HH:mm:ss')}
                        {error.retryCount !== undefined && ` (Retry: ${error.retryCount})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Track Errors */}
            {errorReport.trackErrors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>Track Errors</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {errorReport.trackErrors.map((error) => (
                    <div
                      key={error.trackId}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        color: '#333333',
                      }}
                    >
                      <div style={{ color: '#333333' }}>
                        <strong>{error.trackId}:</strong> {error.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Issue: {error.issue} | {format(error.timestamp, 'HH:mm:ss')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Errors */}
            {errorReport.apiErrors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>API Errors</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {errorReport.apiErrors.slice(-20).map((error, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#d1ecf1',
                        border: '1px solid #0c5460',
                        borderRadius: '4px',
                        color: '#333333',
                      }}
                    >
                      <div style={{ color: '#333333' }}>
                        <strong>[{error.type.toUpperCase()}]:</strong> {error.message}
                      </div>
                      {error.endpoint && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Endpoint: {error.endpoint}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {format(error.timestamp, 'HH:mm:ss')}
                        {error.retryCount !== undefined && ` (Retry: ${error.retryCount})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Errors Message */}
            {errorReport.totalErrors === 0 && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#28a745',
                  fontSize: '18px',
                }}
              >
                ✓ No errors detected. All systems operational.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

