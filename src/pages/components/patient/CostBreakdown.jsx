export default function CostBreakdown() {
  return (
    <div className="card col-span-3">
      <div className="section-title">Cost Breakdown</div>
      <div className="grid-3">
        <div>
          <div className="accent-label">Medicine List</div>
          <div className="cost-row">
            <div>
              <div style={{fontSize:'13px',color:'white'}}>Tamoxifen 20mg</div>
              <div style={{fontSize:'11px',color:'var(--teal)'}}>CVS Pharmacy · 0.3mi →</div>
            </div>
            <div style={{fontSize:'13px',color:'white'}}>$24/mo</div>
          </div>
          <div className="cost-row">
            <div>
              <div style={{fontSize:'13px',color:'white'}}>Ondansetron 8mg</div>
              <div style={{fontSize:'11px',color:'var(--teal)'}}>Walgreens · 0.5mi →</div>
            </div>
            <div style={{fontSize:'13px',color:'white'}}>$18/mo</div>
          </div>
          <div className="cost-row" style={{border:'none'}}>
            <div>
              <div style={{fontSize:'13px',color:'white'}}>Dexamethasone</div>
              <div style={{fontSize:'11px',color:'var(--teal)'}}>RiteAid · 0.8mi →</div>
            </div>
            <div style={{fontSize:'13px',color:'white'}}>$12/mo</div>
          </div>
        </div>
        <div>
          <div className="accent-label">Travel Itinerary</div>
          <div className="cost-row">
            <div style={{fontSize:'13px',color:'white'}}>Cab to UCSD Medical</div>
            <div style={{fontSize:'13px',color:'white'}}>$18</div>
          </div>
          <div className="cost-row">
            <div style={{fontSize:'13px',color:'white'}}>Return cab</div>
            <div style={{fontSize:'13px',color:'white'}}>$18</div>
          </div>
          <div className="cost-row" style={{border:'none'}}>
            <div style={{fontSize:'13px',color:'white'}}>Weekly total (est.)</div>
            <div style={{fontSize:'13px',color:'white'}}>$36/wk</div>
          </div>
        </div>
        <div>
          <div className="accent-label">Surgery / Procedure</div>
          <div className="cost-row">
            <div style={{fontSize:'13px',color:'white'}}>Chemo Session x6</div>
            <div style={{fontSize:'13px',color:'white'}}>$2,400</div>
          </div>
          <div className="cost-row">
            <div style={{fontSize:'13px',color:'white'}}>Surgical Procedure</div>
            <div style={{fontSize:'13px',color:'white'}}>$1,200</div>
          </div>
          <div className="cost-row" style={{border:'none'}}>
            <div style={{fontSize:'13px',color:'white'}}>Anesthesia</div>
            <div style={{fontSize:'13px',color:'white'}}>$480</div>
          </div>
        </div>
      </div>
    </div>
  )
}
