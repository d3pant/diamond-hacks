export default function PatientTable({ onSelectPatient }) {
  const patients = [
    { id: 1, name: "Maria Gonzalez", age: 67, diagnosis: "Stage 2 Breast Cancer", status: "Active" },
    { id: 2, name: "James Patel", age: 54, diagnosis: "Type 2 Diabetes", status: "Active" },
    { id: 3, name: "Aisha Noor", age: 43, diagnosis: "Hypertension", status: "Pending" },
  ]

  return (
    <>
      <div className="page-title">Patient List</div>
      <div className="page-sub">Select a patient to upload diagnosis and reports</div>
      {patients.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelectPatient(p)}
          className="patient-row"
        >
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div className="avatar" style={{background: p.id === 2 ? '#8b5cf6' : p.id === 3 ? 'var(--teal)' : 'var(--accent)'}}>
              {p.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'white'}}>{p.name}</div>
              <div style={{fontSize:'12px',color:'var(--muted)'}}>{p.diagnosis}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontSize:'12px',color:'var(--muted)'}}>Age {p.age}</span>
            <span className={`badge ${p.status === 'Active' ? (p.id === 1 ? 'badge-blue' : 'badge-teal') : 'badge-muted'}`}>{p.status}</span>
            <span style={{color:'var(--muted)',fontSize:'16px'}}>›</span>
          </div>
        </div>
      ))}
    </>
  )
}