import { supabase } from '../supabaseClient'

const tools = [
  {
    title: 'Card Parser',
    description: 'Parse and clean Pokémon card lists from raw set data.',
    icon: '◈',
    status: 'coming soon',
  },
  {
    title: 'Break Report',
    description: 'Process show orders, split ETB winners, and export formatted reports.',
    icon: '◉',
    status: 'coming soon',
  },
  {
    title: 'Card Joiner',
    description: 'Join two card set tables on Pokémon name with color-coded output.',
    icon: '⬡',
    status: 'coming soon',
  },
  {
    title: 'Order Joiner',
    description: 'Merge break orders against the card index by product name.',
    icon: '◎',
    status: 'coming soon',
  },
]

export default function Portal({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>RIPZILLA</span>
        <div style={styles.navRight}>
          <span style={styles.navEmail}>{user?.email}</span>
          <button onClick={handleSignOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Internal Tools</h1>
          <p style={styles.heroSub}>
            Everything you need to manage breaks, parse cards, and process orders.
          </p>
        </div>

        <div style={styles.grid}>
          {tools.map((tool) => (
            <div key={tool.title} style={styles.card}>
              <div style={styles.cardIcon}>{tool.icon}</div>
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>{tool.title}</h2>
                  <span style={styles.badge}>{tool.status}</span>
                </div>
                <p style={styles.cardDesc}>{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    fontFamily: "'Inter', sans-serif",
    color: '#e8e8f0',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: '64px',
    borderBottom: '1px solid #1e1e2e',
    background: '#0d0d14',
  },
  navLogo: {
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '5px',
    color: '#e8e8f0',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navEmail: {
    fontSize: '13px',
    color: '#555570',
  },
  signOut: {
    background: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#888899',
    fontSize: '13px',
    padding: '6px 14px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '64px 24px',
  },
  hero: {
    marginBottom: '56px',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 12px',
    color: '#e8e8f0',
  },
  heroSub: {
    fontSize: '16px',
    color: '#555570',
    margin: '0',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#13131a',
    border: '1px solid #1e1e2e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'border-color 0.2s',
    cursor: 'default',
  },
  cardIcon: {
    fontSize: '22px',
    color: '#5c5cff',
    lineHeight: '1',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0',
    color: '#e8e8f0',
  },
  badge: {
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#555570',
    background: '#1a1a26',
    border: '1px solid #2a2a3a',
    borderRadius: '4px',
    padding: '3px 8px',
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#555570',
    margin: '0',
    lineHeight: '1.6',
  },
}
