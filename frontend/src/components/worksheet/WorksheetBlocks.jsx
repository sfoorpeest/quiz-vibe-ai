import React from 'react';
import { School, User, Phone, BookOpen } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// WORKSHEET BLOCK COMPONENTS — Render từng loại block
// Hỗ trợ 2 chế độ: Interactive (web) & Print (giấy)
// ═══════════════════════════════════════════════════════════════

/* ─── HEADER BLOCK: Trường, Lớp, Họ tên, SĐT ─── */
export function HeaderBlock({ data, onChange, editable }) {
  const handleChange = (field, value) => {
    if (onChange) onChange({ ...data, [field]: value });
  };

  return (
    <div className="ws-header-block">
      <div className="ws-header-grid">
        <div className="ws-header-field">
          <label className="ws-label">Trường:</label>
          <input
            type="text"
            value={data.schoolName || ''}
            onChange={e => handleChange('schoolName', e.target.value)}
            placeholder="..........................."
            className="ws-input"
            readOnly={!editable}
          />
        </div>
        <div className="ws-header-field">
          <label className="ws-label">Họ và tên:</label>
          <input
            type="text"
            value={data.studentName || ''}
            onChange={e => handleChange('studentName', e.target.value)}
            placeholder="..........................."
            className="ws-input"
            readOnly={!editable}
          />
        </div>
        <div className="ws-header-field">
          <label className="ws-label">Lớp:</label>
          <input
            type="text"
            value={data.className || ''}
            onChange={e => handleChange('className', e.target.value)}
            placeholder="..............."
            className="ws-input ws-input-short"
            readOnly={!editable}
          />
        </div>
        <div className="ws-header-field">
          <label className="ws-label">SĐT:</label>
          <input
            type="text"
            value={data.phone || ''}
            onChange={e => handleChange('phone', e.target.value)}
            placeholder="..........................."
            className="ws-input"
            readOnly={!editable}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── TABLE BLOCK: Bảng key-value (1 cột label + dòng trả lời) ─── */
export function TableBlock({ data, onChange, editable }) {
  const handleQuestionChange = (value) => {
    if (onChange) onChange({ ...data, question: value });
  };

  const handleAddRow = () => {
    if (onChange) {
      onChange({
        ...data,
        rows: [...data.rows, { label: 'Mục mới', lines: 3 }],
      });
    }
  };

  const handleRemoveRow = (idx) => {
    if (onChange) {
      onChange({
        ...data,
        rows: data.rows.filter((_, i) => i !== idx),
      });
    }
  };

  const handleRowLabelChange = (idx, value) => {
    if (onChange) {
      const newRows = [...data.rows];
      newRows[idx] = { ...newRows[idx], label: value };
      onChange({ ...data, rows: newRows });
    }
  };

  return (
    <div className="ws-table-block">
      {editable ? (
        <input
          className="ws-question-input"
          value={data.question}
          onChange={e => handleQuestionChange(e.target.value)}
        />
      ) : (
        <p className="ws-question">{data.question}</p>
      )}
      <table className="ws-table">
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={idx} className="ws-table-row">
              <td className="ws-table-label-cell">
                {editable ? (
                  <input
                    className="ws-table-label-input"
                    value={row.label}
                    onChange={e => handleRowLabelChange(idx, e.target.value)}
                  />
                ) : (
                  <span className="ws-table-label">{row.label}</span>
                )}
                {editable && data.rows.length > 1 && (
                  <button
                    onClick={() => handleRemoveRow(idx)}
                    className="ws-remove-row-btn"
                    title="Xóa hàng"
                  >×</button>
                )}
              </td>
              <td className="ws-table-answer-cell">
                {Array.from({ length: row.lines }).map((_, lineIdx) => (
                  <div key={lineIdx} className="ws-dotted-line">
                    <input type="text" className="ws-line-input" placeholder="" />
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <button onClick={handleAddRow} className="ws-add-row-btn">
          + Thêm hàng
        </button>
      )}
    </div>
  );
}

/* ─── TWO COLUMN TABLE BLOCK: Bảng 2 cột (đồng nghĩa / trái nghĩa) ─── */
export function TwoColumnTableBlock({ data, onChange, editable }) {
  const handleQuestionChange = (value) => {
    if (onChange) onChange({ ...data, question: value });
  };

  const handleRowsChange = (delta) => {
    if (onChange) {
      const newRows = Math.max(1, data.rows + delta);
      onChange({ ...data, rows: newRows });
    }
  };

  return (
    <div className="ws-table-block">
      {editable ? (
        <input
          className="ws-question-input"
          value={data.question}
          onChange={e => handleQuestionChange(e.target.value)}
        />
      ) : (
        <p className="ws-question">{data.question}</p>
      )}
      <table className="ws-table ws-two-col-table">
        <thead>
          <tr>
            {data.columns.map((col, idx) => (
              <th key={idx} className="ws-col-header">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Sample row */}
          <tr className="ws-sample-row">
            {data.columns.map((col, idx) => (
              <td key={idx} className="ws-sample-cell">{col.sample}</td>
            ))}
          </tr>
          {/* Answer rows */}
          {Array.from({ length: data.rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {data.columns.map((_, colIdx) => (
                <td key={colIdx} className="ws-answer-cell">
                  <div className="ws-dotted-line">
                    <input type="text" className="ws-line-input" placeholder="" />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <div className="ws-row-controls">
          <button onClick={() => handleRowsChange(-1)} className="ws-add-row-btn">− Bớt dòng</button>
          <span className="ws-row-count">{data.rows} dòng</span>
          <button onClick={() => handleRowsChange(1)} className="ws-add-row-btn">+ Thêm dòng</button>
        </div>
      )}
    </div>
  );
}

/* ─── OPEN QUESTION BLOCK: Câu hỏi tự luận + dòng kẻ ─── */
export function OpenQuestionBlock({ data, onChange, editable }) {
  const handleQuestionChange = (value) => {
    if (onChange) onChange({ ...data, question: value });
  };

  const handleLinesChange = (delta) => {
    if (onChange) {
      const newLines = Math.max(1, data.lines + delta);
      onChange({ ...data, lines: newLines });
    }
  };

  return (
    <div className="ws-question-block">
      {editable ? (
        <textarea
          className="ws-question-textarea"
          value={data.question}
          onChange={e => handleQuestionChange(e.target.value)}
          rows={2}
        />
      ) : (
        <p className="ws-question">{data.question}</p>
      )}
      <div className="ws-answer-lines">
        {Array.from({ length: data.lines }).map((_, idx) => (
          <div key={idx} className="ws-dotted-line">
            <input type="text" className="ws-line-input" placeholder="" />
          </div>
        ))}
      </div>
      {editable && (
        <div className="ws-row-controls">
          <button onClick={() => handleLinesChange(-1)} className="ws-add-row-btn">− Bớt dòng</button>
          <span className="ws-row-count">{data.lines} dòng</span>
          <button onClick={() => handleLinesChange(1)} className="ws-add-row-btn">+ Thêm dòng</button>
        </div>
      )}
    </div>
  );
}

/* ─── FILL IN BLANK BLOCK: Điền vào chỗ trống ─── */
export function FillInBlankBlock({ data, onChange, editable }) {
  const handleQuestionChange = (value) => {
    if (onChange) onChange({ ...data, question: value });
  };

  const handlePromptChange = (idx, value) => {
    if (onChange) {
      const newItems = [...data.items];
      newItems[idx] = { ...newItems[idx], prompt: value };
      onChange({ ...data, items: newItems });
    }
  };

  const handleAddItem = () => {
    if (onChange) {
      onChange({
        ...data,
        items: [...data.items, { prompt: 'Câu hỏi mới:', answer: '' }],
      });
    }
  };

  const handleRemoveItem = (idx) => {
    if (onChange) {
      onChange({
        ...data,
        items: data.items.filter((_, i) => i !== idx),
      });
    }
  };

  return (
    <div className="ws-question-block">
      {editable ? (
        <input
          className="ws-question-input"
          value={data.question}
          onChange={e => handleQuestionChange(e.target.value)}
        />
      ) : (
        <p className="ws-question">{data.question}</p>
      )}
      <div className="ws-fill-items">
        {data.items.map((item, idx) => (
          <div key={idx} className="ws-fill-item">
            {editable ? (
              <div className="ws-fill-editable-row">
                <input
                  className="ws-fill-prompt-input"
                  value={item.prompt}
                  onChange={e => handlePromptChange(idx, e.target.value)}
                />
                {data.items.length > 1 && (
                  <button onClick={() => handleRemoveItem(idx)} className="ws-remove-row-btn">×</button>
                )}
              </div>
            ) : (
              <span className="ws-fill-prompt">{item.prompt}</span>
            )}
            <div className="ws-dotted-line">
              <input type="text" className="ws-line-input" placeholder="" />
            </div>
          </div>
        ))}
      </div>
      {editable && (
        <button onClick={handleAddItem} className="ws-add-row-btn">+ Thêm câu</button>
      )}
    </div>
  );
}
