import React, { useEffect, useMemo, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { CURRENT_RELEASE, RELEASE_DOCS } from './releaseNotes.js';

function DocumentViewer({ selectedDocId, onSelectDoc }) {
  const selectedDoc = useMemo(
    () => RELEASE_DOCS.find((doc) => doc.id === selectedDocId) || RELEASE_DOCS[0],
    [selectedDocId]
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gap: '16px',
      minHeight: '420px',
    }}>
      <div style={{
        display: 'grid',
        gap: '10px',
        alignContent: 'start',
      }}>
        {RELEASE_DOCS.map((doc) => {
          const active = doc.id === selectedDoc.id;
          return (
            <button
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              style={{
                textAlign: 'left',
                padding: '12px',
                borderRadius: '8px',
                border: active ? '1px solid #1890ff' : '1px solid #e5e7eb',
                backgroundColor: active ? '#e6f4ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', color: active ? '#1890ff' : '#333' }}>
                {doc.title}
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                {doc.description}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fff',
        }}>
          <div style={{ fontWeight: 700 }}>{selectedDoc.title}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {selectedDoc.description}
          </div>
        </div>
        <div style={{
          margin: 0,
          padding: '18px',
          overflow: 'auto',
          flex: 1,
        }}>
          <MarkdownRenderer content={selectedDoc.content} />
        </div>
      </div>
    </div>
  );
}

export default function ReleaseAnnouncementPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('announcement');
  const [selectedDocId, setSelectedDocId] = useState(RELEASE_DOCS[0].id);

  useEffect(() => {
    const storageKey = `rv-image-optimize-release-${CURRENT_RELEASE.version}`;
    try {
      const hasViewed = window.localStorage.getItem(storageKey);
      if (!hasViewed) {
        setIsOpen(true);
        window.localStorage.setItem(storageKey, 'seen');
      }
    } catch (error) {
      console.warn('读取公告缓存失败:', error);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const openAnnouncement = () => {
    setActiveTab('announcement');
    setIsOpen(true);
  };

  const openDocs = (docId = RELEASE_DOCS[0].id) => {
    setSelectedDocId(docId);
    setActiveTab('docs');
    setIsOpen(true);
  };

  return (
    <>
      <div style={{
        marginBottom: '24px',
        padding: '16px 18px',
        borderRadius: '10px',
        border: '1px solid #d9e8ff',
        background: 'linear-gradient(135deg, #f7fbff 0%, #eef6ff 100%)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8' }}>
              最新版本公告：{CURRENT_RELEASE.title}
            </div>
            <div style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
              发布时间：{CURRENT_RELEASE.date}，支持在预览页内直接查看更新内容和 Markdown 使用文档。
            </div>
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#333' }}>
              本次重点：{CURRENT_RELEASE.summary}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={openAnnouncement}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#1890ff',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              查看更新公告
            </button>
            <button
              onClick={() => openDocs('readme')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #1890ff',
                backgroundColor: '#fff',
                color: '#1890ff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              浏览使用文档
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1200px, 100%)',
              maxHeight: '90vh',
              backgroundColor: '#fff',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>
                  {CURRENT_RELEASE.title}
                </div>
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
                  本次预览站更新摘要与文档浏览中心
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
                aria-label="关闭公告"
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '0 22px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
            }}>
              {[
                { id: 'announcement', label: '本次更新' },
                { id: 'docs', label: '文档浏览' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '14px 6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
                      color: active ? '#1890ff' : '#666',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '22px', overflow: 'auto' }}>
              {activeTab === 'announcement' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 360px) 1fr',
                  gap: '20px',
                }}>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '18px',
                    backgroundColor: '#fafafa',
                  }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>当前公告版本</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginTop: '8px' }}>
                      v{CURRENT_RELEASE.version}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      发布时间：{CURRENT_RELEASE.date}
                    </div>
                  </div>

                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '18px',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>
                      本次新增功能
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {CURRENT_RELEASE.highlights.map((change, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e5e7eb',
                            lineHeight: 1.7,
                          }}
                        >
                          {index + 1}. {change}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {CURRENT_RELEASE.quickLinks.map((item, index) => (
                        <button
                          key={item.docId}
                          onClick={() => openDocs(item.docId)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: index === 0 ? 'none' : '1px solid #d1d5db',
                            backgroundColor: index === 0 ? '#1890ff' : '#fff',
                            color: index === 0 ? '#fff' : '#333',
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <DocumentViewer
                  selectedDocId={selectedDocId}
                  onSelectDoc={setSelectedDocId}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
