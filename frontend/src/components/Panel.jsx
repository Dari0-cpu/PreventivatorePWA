import React from 'react';

/** Contenitore standard dell'app: titolo serif, eyebrow mono, azioni a destra. */
export function Panel({ step, eyebrow, title, sub, actions, children, id, className = '' }) {
  return (
    <section className={`panel ${className}`} id={id} aria-label={title}>
      <div className="panel-head">
        <div style={{ minWidth: 0 }}>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h2 className="panel-title" style={{ marginTop: eyebrow ? 4 : 0 }}>
            {step ? <span className="step-num" style={{ marginRight: 10 }}>{step}</span> : null}
            {title}
          </h2>
          {sub ? <p className="panel-sub">{sub}</p> : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
