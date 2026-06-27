import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const MAX_FILES = 4
const MAX_FILE_SIZE = 5 * 1024 * 1024      // 5MB per file
const MAX_TOTAL_SIZE = 10 * 1024 * 1024    // 10MB total per case

function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function getFileIcon(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','webp','heic'].includes(ext)) return '🖼️'
  if (['pdf'].includes(ext)) return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx','csv'].includes(ext)) return '📊'
  if (['mp4','mov','avi'].includes(ext)) return '🎬'
  return '📎'
}

function isImage(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase()
  return ['jpg','jpeg','png','gif','webp'].includes(ext)
}

function CaseFiles({ caseId, canUpload = false, uploadedBy = null }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (caseId) loadFiles()
  }, [caseId])

  async function loadFiles() {
    const { data } = await supabase
      .from('case_files')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  async function handleUpload(selectedFiles) {
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    setUploadError(null)

    // Check file count limit
    if (files.length + selectedFiles.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed per case. You currently have ${files.length} file${files.length !== 1 ? 's' : ''} attached.`)
      setUploading(false)
      return
    }

    // Check total size limit
    const existingSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0)
    const newSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)
    if (existingSize + newSize > MAX_TOTAL_SIZE) {
      setUploadError(`Total attachments cannot exceed 10MB per case. Current usage: ${formatFileSize(existingSize)}.`)
      setUploading(false)
      return
    }

    for (const file of selectedFiles) {
      // Per-file size limit
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name} is too large. Maximum file size is 5MB.`)
        setUploading(false)
        return
      }

      const safeName = `${caseId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { error: uploadErr } = await supabase.storage
        .from('case-files')
        .upload(safeName, file)

      if (uploadErr) {
        setUploadError(`Failed to upload ${file.name}. Please try again.`)
        setUploading(false)
        return
      }

      await supabase.from('case_files').insert([{
        case_id: caseId,
        file_name: file.name,
        file_path: safeName,
        file_size: file.size,
        uploaded_by: uploadedBy || 'Public',
        created_at: new Date().toISOString(),
      }])
    }

    await loadFiles()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileInput(e) {
    handleUpload(Array.from(e.target.files))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleUpload(Array.from(e.dataTransfer.files))
  }

  function getPublicUrl(filePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/case-files/${filePath}`
  }

  const atLimit = files.length >= MAX_FILES
  const existingSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0)

  return (
    <div>
      {/* Upload area */}
      {canUpload && (
        <div style={{ marginBottom: '16px' }}>
          {atLimit ? (
            <div style={{ padding: '14px 16px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', textAlign: 'center' }}>
              Maximum of {MAX_FILES} files reached for this case.
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#1a56a0' : '#d1d5db'}`,
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? '#eff6ff' : '#f9fafb',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Max {MAX_FILES} files · 5MB per file · 10MB total per case
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {files.length} of {MAX_FILES} files used · {formatFileSize(existingSize)} of 10MB used
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          {uploadError && (
            <div style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px', padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
          No files attached yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map(f => {
            const url = getPublicUrl(f.file_path)
            const img = isImage(f.file_name)
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                {img ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={f.file_name}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', flexShrink: 0 }}
                    />
                  </a>
                ) : (
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{getFileIcon(f.file_name)}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', fontWeight: '600', color: '#1a56a0', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {f.file_name}
                  </a>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {formatFileSize(f.file_size)} · {f.uploaded_by} · {formatDateTime(f.created_at)}
                  </div>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '4px 10px', backgroundColor: '#1a56a0', color: '#ffffff', borderRadius: '4px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  View
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CaseFiles
