import React from 'react';
import { UPLOAD_VALUE_TYPES, UPLOAD_PLACEHOLDERS } from 'rv-image-optimize/upload-core';

export const DEFAULT_UPLOAD_FORM_FIELDS = [
  { id: 'field-file', key: 'file', valueType: 'file', textValue: '' },
  { id: 'field-name', key: 'fileName', valueType: 'fileName', textValue: '' },
  { id: 'field-type', key: 'fileType', valueType: 'fileType', textValue: '' },
  { id: 'field-size', key: 'fileSize', valueType: 'fileSize', textValue: '' },
];

export const DEFAULT_UPLOAD_JSON_TEMPLATE = JSON.stringify({
  file: UPLOAD_PLACEHOLDERS.file,
  fileName: UPLOAD_PLACEHOLDERS.fileName,
  fileType: UPLOAD_PLACEHOLDERS.fileType,
  fileSize: UPLOAD_PLACEHOLDERS.fileSize,
}, null, 2);

const VALUE_TYPE_LABELS = {
  text: '文本',
  file: '压缩后文件',
  fileName: '压缩后文件名',
  fileType: '压缩后文件类型',
  fileSize: '压缩后文件大小',
  originalFileName: '原始文件名',
  originalFileSize: '原始文件大小',
  compressedFileName: '压缩文件名',
  compressedFileType: '压缩文件类型',
  compressedFileSize: '压缩文件大小',
  savedSize: '节省大小',
  savedPercentage: '节省比例',
};

function createUploadField() {
  return {
    id: `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key: '',
    valueType: 'text',
    textValue: '',
  };
}

export default function UploadConfigPanel({
  uploadUrl,
  onUploadUrlChange,
  uploadMethod,
  onUploadMethodChange,
  fileFieldKey,
  onFileFieldKeyChange,
  authorization,
  onAuthorizationChange,
  headersText,
  onHeadersTextChange,
  headerParseError,
  uploadMode,
  onUploadModeChange,
  formFields,
  onUpdateFormField,
  onAddFormField,
  onRemoveFormField,
  jsonTemplate,
  onJsonTemplateChange,
  templateParseError,
  payloadPreview,
  requestHeadersPreview,
}) {
  return (
    <>
      <div style={{
        padding: '15px',
        backgroundColor: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>上传接口配置</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <span>上传接口 URL</span>
            <input
              type="text"
              value={uploadUrl}
              onChange={(e) => onUploadUrlChange(e.target.value)}
              placeholder="https://zenithreview.net/admin/upload"
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <span>请求方式</span>
            <select
              value={uploadMethod}
              onChange={(e) => onUploadMethodChange(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <span>文件字段兜底 Key</span>
            <input
              type="text"
              value={fileFieldKey}
              onChange={(e) => onFileFieldKeyChange(e.target.value)}
              placeholder="file"
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
          <span>Authorization</span>
          <textarea
            value={authorization}
            onChange={(e) => onAuthorizationChange(e.target.value)}
            placeholder="Bearer eyJ..."
            rows={3}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
          <span>额外请求头 JSON</span>
          <textarea
            value={headersText}
            onChange={(e) => onHeadersTextChange(e.target.value)}
            rows={4}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
          />
        </label>
        {headerParseError && (
          <div style={{ color: '#f5222d', fontSize: '12px', marginBottom: '12px' }}>
            额外请求头 JSON 格式错误：{headerParseError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            onClick={() => onUploadModeChange('formFields')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #1890ff',
              backgroundColor: uploadMode === 'formFields' ? '#1890ff' : '#fff',
              color: uploadMode === 'formFields' ? '#fff' : '#1890ff',
              cursor: 'pointer'
            }}
          >
            可视化表单模式
          </button>
          <button
            onClick={() => onUploadModeChange('jsonTemplate')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #1890ff',
              backgroundColor: uploadMode === 'jsonTemplate' ? '#1890ff' : '#fff',
              color: uploadMode === 'jsonTemplate' ? '#fff' : '#1890ff',
              cursor: 'pointer'
            }}
          >
            JSON 高级模式
          </button>
        </div>

        {uploadMode === 'formFields' ? (
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              每一项对应一个 `form-data` 字段，值类型可以选择压缩后的文件、文件名、大小等动态变量。
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {formFields.map((field) => (
                <div
                  key={field.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px, 1fr) minmax(150px, 1fr) minmax(180px, 2fr) auto',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => onUpdateFormField(field.id, 'key', e.target.value)}
                    placeholder="字段名"
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <select
                    value={field.valueType}
                    onChange={(e) => onUpdateFormField(field.id, 'valueType', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    {UPLOAD_VALUE_TYPES.map((valueType) => (
                      <option key={valueType} value={valueType}>
                        {VALUE_TYPE_LABELS[valueType] || valueType}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={field.textValue}
                    onChange={(e) => onUpdateFormField(field.id, 'textValue', e.target.value)}
                    disabled={field.valueType !== 'text'}
                    placeholder={field.valueType === 'text' ? '文本值' : '当前类型会自动注入动态值'}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button
                    onClick={() => onRemoveFormField(field.id)}
                    disabled={formFields.length === 1}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: formFields.length === 1 ? '#d9d9d9' : '#ff4d4f',
                      color: '#fff',
                      cursor: formFields.length === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onAddFormField(createUploadField())}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#1890ff',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              新增字段
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              支持占位符：{Object.values(UPLOAD_PLACEHOLDERS).join(' / ')}
            </div>
            <textarea
              value={jsonTemplate}
              onChange={(e) => onJsonTemplateChange(e.target.value)}
              rows={10}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
            {templateParseError && (
              <div style={{ color: '#f5222d', fontSize: '12px', marginTop: '8px' }}>
                JSON 模板格式错误：{templateParseError}
              </div>
            )}
          </div>
        )}
      </div>

      {payloadPreview && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fffbe6',
          borderRadius: '6px',
          marginBottom: '12px',
          border: '1px solid #ffe58f'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '10px' }}>当前上传请求预览（基于第一个已压缩文件）</h4>
          {payloadPreview.error ? (
            <div style={{ color: '#d48806', fontSize: '12px' }}>{payloadPreview.error}</div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                请求方式：{payloadPreview.config.method}，目标地址：{payloadPreview.config.url}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                Authorization：{authorization ? `${authorization.slice(0, 24)}...` : '未填写'}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                额外请求头：{requestHeadersPreview ? Object.keys(requestHeadersPreview).join(', ') || '无' : 'JSON 格式错误'}
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {payloadPreview.entries.map((entry, index) => (
                  <div
                    key={`${entry.key}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 120px 1fr',
                      gap: '10px',
                      fontSize: '12px',
                      padding: '6px 8px',
                      backgroundColor: '#fff',
                      borderRadius: '4px'
                    }}
                  >
                    <strong>{entry.key}</strong>
                    <span>{entry.isFile ? '文件' : '文本'}</span>
                    <span style={{ wordBreak: 'break-all' }}>{entry.previewValue}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
