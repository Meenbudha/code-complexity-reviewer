import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly Plan",
    price: 14.99,
    periodLabel: "/ month",
    billedText: "Billed $14.99 monthly",
    discount: null,
    savings: 0,
  },
  quarterly: {
    id: "quarterly",
    name: "3 Months Plan",
    price: 11.99,
    periodLabel: "/ month",
    billedText: "Billed $35.97 every 3 months",
    discount: "20% OFF",
    savings: 20,
  },
  yearly: {
    id: "yearly",
    name: "Yearly Plan",
    price: 8.99,
    periodLabel: "/ month",
    billedText: "Billed $107.88 annually",
    discount: "40% OFF — BEST VALUE",
    savings: 40,
  },
};

const FEATURE_COMPARISON = [
  { feature: "Daily Analysis Quota", free: "5 analyses / day", pro: "Unlimited ♾️" },
  { feature: "Complexity Graphing", free: "Basic Big-O Curve", pro: "Interactive Custom Charts 📊" },
  { feature: "Security & Risk Audits", free: "Basic Warnings", pro: "Deep Code Risk & Memory Leak Detection 🛡️" },
  { feature: "AI Chat Mentor", free: "Limited History", pro: "Unlimited Chat & Context Memory 💬" },
  { feature: "Report Exporting", free: "Not Available", pro: "Export to PDF & Markdown 📄" },
  { feature: "LeetCode & System Design Templates", free: "Standard Only", pro: "Full Template Library 📚" },
  { feature: "Customer Support", free: "Community Forum", pro: "Priority 24/7 VIP Support 🌟" },
];

const FAQS = [
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes! You can upgrade, downgrade, or cancel your subscription at any time with one click. Your Pro access remains active until the end of your billing period."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and UPI."
  },
  {
    q: "How does the 3-Month and Yearly billing work?",
    a: "When you choose the 3-Month or Yearly plan, you get a massive discount (20% to 40% off) billed as one convenient payment."
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee. If you're not completely satisfied with CodeMind Pro, contact support for a full refund."
  }
];

export default function PricingPage({ onBackToDashboard }) {
  const { user, isPro, upgradeToPro } = useAuth();
  const [billingCycle, setBillingCycle] = useState("yearly"); // monthly | quarterly | yearly
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const selectedPlan = PLANS[billingCycle];

  const handleCompleteSubscription = () => {
    upgradeToPro({
      planType: selectedPlan.name,
      proExpiry: new Date(Date.now() + (billingCycle === "yearly" ? 365 : billingCycle === "quarterly" ? 90 : 30) * 86400000).toLocaleDateString()
    });
    setCheckoutSuccess(true);
    setTimeout(() => {
      setShowCheckout(false);
      setCheckoutSuccess(false);
    }, 2000);
  };

  return (
    <div style={styles.container}>
      {/* Top Banner Navigation */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBackToDashboard}>
          ← Back to Workspace
        </button>
        {isPro && (
          <div style={styles.activeProBadge}>
            👑 Active Pro Plan ({user?.planType || "Pro"})
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>⚡ CODEMIND AI PREMIUM</div>
        <h1 style={styles.heroTitle}>
          Supercharge Your Engineering with <span style={styles.gradientText}>CodeMind Pro</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Unlimited AI code reviews, high-speed algorithmic analysis, deep vulnerability audits, and LeetCode-grade insights.
        </p>

        {/* Billing Cycle Toggle */}
        <div style={styles.toggleWrapper}>
          <button
            style={billingCycle === "monthly" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billed
          </button>
          <button
            style={billingCycle === "quarterly" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setBillingCycle("quarterly")}
          >
            3 Months <span style={styles.saveBadge}>Save 20%</span>
          </button>
          <button
            style={billingCycle === "yearly" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly <span style={styles.saveBadgeGold}>Save 40% — Best Value</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={styles.cardsGrid}>
        {/* Free Plan Card */}
        <div style={styles.cardFree}>
          <div style={styles.cardHeader}>
            <h3 style={styles.planTitle}>Free Tier</h3>
            <p style={styles.planDesc}>Essential tools for casual developers &amp; students.</p>
          </div>
          <div style={styles.priceBox}>
            <span style={styles.priceAmount}>$0</span>
            <span style={styles.pricePeriod}>/ forever</span>
          </div>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>✅ 5 Code Analyses per day</li>
            <li style={styles.featureItem}>✅ Standard Offline &amp; AI Engine</li>
            <li style={styles.featureItem}>✅ Basic Complexity Graphs</li>
            <li style={styles.featureItem}>✅ Basic AI Chat Mentor</li>
            <li style={styles.featureItemDisabled}>❌ Priority High-Speed Queue</li>
            <li style={styles.featureItemDisabled}>❌ Unlimited Daily Analyses</li>
            <li style={styles.featureItemDisabled}>❌ Security &amp; Memory Audits</li>
          </ul>
          <button
            style={isPro ? styles.secondaryBtn : styles.currentBtn}
            disabled={!isPro}
            onClick={onBackToDashboard}
          >
            {isPro ? "Downgrade to Free" : "Current Plan"}
          </button>
        </div>

        {/* Pro Plan Card (Featured) */}
        <div style={styles.cardPro}>
          <div style={styles.recommendedTag}>⚡ RECOMMENDED BY DEVELOPERS</div>
          <div style={styles.cardHeader}>
            <h3 style={styles.planTitlePro}>Pro Plan</h3>
            <p style={styles.planDescPro}>For ambitious engineers, interview prep, &amp; tech leads.</p>
          </div>
          <div style={styles.priceBox}>
            <span style={styles.priceAmountPro}>${selectedPlan.price}</span>
            <span style={styles.pricePeriodPro}>{selectedPlan.periodLabel}</span>
          </div>
          <div style={styles.billedText}>{selectedPlan.billedText}</div>

          <ul style={styles.featureList}>
            <li style={styles.featureItemPro}>🚀 <strong>Unlimited AI Code Analyses</strong></li>
            <li style={styles.featureItemPro}>⚡ <strong>High-Speed Priority Compute Queue</strong></li>
            <li style={styles.featureItemPro}>🛡️ <strong>Deep Security &amp; Risk Audits</strong></li>
            <li style={styles.featureItemPro}>💬 <strong>Unlimited AI Chat Mentor History</strong></li>
            <li style={styles.featureItemPro}>📊 <strong>Custom Interactive Complexity Charts</strong></li>
            <li style={styles.featureItemPro}>📄 <strong>Export PDF &amp; Markdown Reports</strong></li>
            <li style={styles.featureItemPro}>📚 <strong>LeetCode &amp; System Design Templates</strong></li>
            <li style={styles.featureItemPro}>🌟 <strong>24/7 VIP Priority Support</strong></li>
          </ul>

          <button
            style={isPro ? styles.activeProBtn : styles.subscribeBtn}
            onClick={() => {
              if (!isPro) setShowCheckout(true);
            }}
          >
            {isPro ? "⭐ You Are a Pro Member" : `Upgrade to Pro — $${selectedPlan.price}/mo`}
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>Detailed Plan Comparison</h2>
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.thFeature}>Features</th>
                <th style={styles.thPlan}>Free</th>
                <th style={styles.thPro}>Pro 👑</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.tdFeature}>{row.feature}</td>
                  <td style={styles.tdFree}>{row.free}</td>
                  <td style={styles.tdPro}>{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={styles.faqSection}>
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqGrid}>
          {FAQS.map((faq, index) => (
            <div
              key={index}
              style={styles.faqCard}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div style={styles.faqHeader}>
                <h4 style={styles.faqQuestion}>{faq.q}</h4>
                <span style={styles.faqIcon}>{activeFaq === index ? "−" : "+"}</span>
              </div>
              {activeFaq === index && <p style={styles.faqAnswer}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            {checkoutSuccess ? (
              <div style={styles.successBox}>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🎉</div>
                <h2 style={{ color: "#22c55e", margin: "0 0 10px 0" }}>Welcome to CodeMind Pro!</h2>
                <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>
                  Your subscription ({selectedPlan.name}) is now active. Enjoy unlimited AI analysis!
                </p>
              </div>
            ) : (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0, color: "var(--text-main)" }}>Checkout — {selectedPlan.name}</h3>
                  <button style={styles.closeBtn} onClick={() => setShowCheckout(false)}>✕</button>
                </div>

                <div style={styles.modalBody}>
                  <div style={styles.orderSummary}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "var(--text-dim)" }}>Subscription:</span>
                      <strong style={{ color: "var(--text-main)" }}>{selectedPlan.name}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "var(--text-dim)" }}>Price:</span>
                      <strong style={{ color: "var(--primary)" }}>${selectedPlan.price} / month</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-dim)" }}>
                      <span>Billing Detail:</span>
                      <span>{selectedPlan.billedText}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <label style={styles.fieldLabel}>Payment Method</label>
                  <div style={styles.paymentMethods}>
                    {["card", "paypal", "applepay"].map(m => (
                      <button
                        key={m}
                        style={paymentMethod === m ? styles.payBtnActive : styles.payBtn}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m === "card" ? "💳 Credit Card" : m === "paypal" ? "🅿️ PayPal" : "🍏 Apple Pay"}
                      </button>
                    ))}
                  </div>

                  {/* Card Input Simulation */}
                  {paymentMethod === "card" && (
                    <div style={styles.formFields}>
                      <input style={styles.modalInput} placeholder="Cardholder Name" defaultValue={user?.name || "Senior Developer"} />
                      <input style={styles.modalInput} placeholder="Card Number (4242 •••• •••• 4242)" defaultValue="4242 •••• •••• 4242" />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input style={{ ...styles.modalInput, flex: 1 }} placeholder="MM/YY" defaultValue="12/28" />
                        <input style={{ ...styles.modalInput, flex: 1 }} placeholder="CVC" defaultValue="123" />
                      </div>
                    </div>
                  )}

                  <button style={styles.confirmPayBtn} onClick={handleCompleteSubscription}>
                    🔒 Confirm &amp; Upgrade Now (${selectedPlan.price}/mo)
                  </button>
                  <p style={styles.securityNote}>🔒 Encrypted 256-bit SSL Payment. Cancel anytime.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles (Glassmorphic Modern Dark Theme) ──────────────────────────────────
const styles = {
  container: {
    height: "100vh",
    maxHeight: "100vh",
    backgroundColor: "var(--bg-main)",
    color: "var(--text-main)",
    padding: "30px 40px 100px 40px",
    fontFamily: "'Inter', sans-serif",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  backBtn: {
    backgroundColor: "var(--bg-panel)",
    border: "1px solid var(--border)",
    color: "var(--text-main)",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  activeProBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    color: "#f59e0b",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "0.85rem",
  },
  hero: {
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto 40px auto",
  },
  heroBadge: {
    display: "inline-block",
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    border: "1px solid rgba(6, 182, 212, 0.3)",
    color: "#06b6d4",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "16px",
  },
  heroTitle: {
    fontSize: "2.8rem",
    fontWeight: "800",
    letterSpacing: "-1px",
    margin: "0 0 16px 0",
    color: "var(--text-hero)",
  },
  gradientText: {
    background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "1.1rem",
    color: "var(--text-dim)",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  toggleWrapper: {
    display: "inline-flex",
    backgroundColor: "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "4px",
    gap: "4px",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  toggleActive: {
    backgroundColor: "var(--primary)",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
  },
  saveBadge: {
    backgroundColor: "#ef4444",
    color: "#fff",
    fontSize: "0.65rem",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "6px",
  },
  saveBadgeGold: {
    backgroundColor: "#f59e0b",
    color: "#000",
    fontSize: "0.65rem",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "6px",
    fontWeight: "800",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "30px",
    maxWidth: "900px",
    margin: "0 auto 60px auto",
  },
  cardFree: {
    backgroundColor: "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
  },
  cardPro: {
    backgroundColor: "#1e293b",
    border: "2px solid #06b6d4",
    borderRadius: "20px",
    padding: "36px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)",
  },
  recommendedTag: {
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#06b6d4",
    color: "#000",
    fontSize: "0.75rem",
    fontWeight: "800",
    padding: "4px 16px",
    borderRadius: "12px",
    letterSpacing: "0.5px",
  },
  cardHeader: { marginBottom: "20px" },
  planTitle: { fontSize: "1.4rem", fontWeight: "700", margin: "0 0 6px 0", color: "var(--text-hero)" },
  planTitlePro: { fontSize: "1.4rem", fontWeight: "800", margin: "0 0 6px 0", color: "#06b6d4" },
  planDesc: { fontSize: "0.85rem", color: "var(--text-dim)", margin: 0 },
  planDescPro: { fontSize: "0.85rem", color: "var(--text-dim)", margin: 0 },
  priceBox: { display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" },
  priceAmount: { fontSize: "2.8rem", fontWeight: "800", color: "var(--text-hero)" },
  priceAmountPro: { fontSize: "2.8rem", fontWeight: "800", color: "#06b6d4" },
  pricePeriod: { color: "var(--text-dim)", fontSize: "0.9rem" },
  pricePeriodPro: { color: "var(--text-dim)", fontSize: "0.9rem" },
  billedText: { fontSize: "0.8rem", color: "#94a3b8", marginBottom: "20px" },
  featureList: { listStyle: "none", padding: 0, margin: "0 0 30px 0", display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { fontSize: "0.9rem", color: "var(--text-main)" },
  featureItemDisabled: { fontSize: "0.9rem", color: "var(--text-dim)", opacity: 0.5 },
  featureItemPro: { fontSize: "0.9rem", color: "var(--text-main)" },
  currentBtn: {
    marginTop: "auto",
    padding: "14px",
    backgroundColor: "var(--bg-input)",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "default",
  },
  secondaryBtn: {
    marginTop: "auto",
    padding: "14px",
    backgroundColor: "transparent",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  subscribeBtn: {
    marginTop: "auto",
    padding: "16px",
    backgroundColor: "linear-gradient(135deg, #06b6d4, #0891b2)",
    background: "#06b6d4",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(6, 182, 212, 0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  activeProBtn: {
    marginTop: "auto",
    padding: "16px",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    color: "#f59e0b",
    border: "1px solid #f59e0b",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "800",
    cursor: "default",
  },
  tableSection: { maxWidth: "900px", margin: "0 auto 60px auto" },
  sectionTitle: { fontSize: "1.8rem", fontWeight: "800", textAlign: "center", marginBottom: "30px", color: "var(--text-hero)" },
  tableCard: { backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeadRow: { backgroundColor: "var(--bg-input)", borderBottom: "1px solid var(--border)" },
  thFeature: { padding: "16px 20px", color: "var(--text-dim)", fontSize: "0.85rem", textTransform: "uppercase" },
  thPlan: { padding: "16px 20px", color: "var(--text-dim)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "center" },
  thPro: { padding: "16px 20px", color: "#06b6d4", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "center" },
  trEven: { backgroundColor: "transparent", borderBottom: "1px solid var(--border)" },
  trOdd: { backgroundColor: "rgba(255,255,255,0.015)", borderBottom: "1px solid var(--border)" },
  tdFeature: { padding: "14px 20px", fontWeight: "600", fontSize: "0.9rem" },
  tdFree: { padding: "14px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem" },
  tdPro: { padding: "14px 20px", textAlign: "center", color: "#06b6d4", fontWeight: "700", fontSize: "0.85rem" },
  faqSection: { maxWidth: "800px", margin: "0 auto" },
  faqGrid: { display: "flex", flexDirection: "column", gap: "14px" },
  faqCard: { backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 24px", cursor: "pointer" },
  faqHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { margin: 0, fontSize: "1rem", fontWeight: "600" },
  faqIcon: { fontSize: "1.4rem", color: "var(--primary)" },
  faqAnswer: { marginTop: "12px", color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: "1.6" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  modalCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "20px", width: "90%", maxWidth: "460px", padding: "30px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", color: "var(--text-dim)", fontSize: "1.2rem", cursor: "pointer" },
  orderSummary: { backgroundColor: "var(--bg-input)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "20px" },
  fieldLabel: { display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase" },
  paymentMethods: { display: "flex", gap: "8px", marginBottom: "20px" },
  payBtn: { flex: 1, padding: "10px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-main)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },
  payBtnActive: { flex: 1, padding: "10px", backgroundColor: "rgba(6,182,212,0.15)", border: "1px solid #06b6d4", color: "#06b6d4", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem" },
  formFields: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  modalInput: { backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", color: "var(--text-main)", fontSize: "0.9rem", outline: "none" },
  confirmPayBtn: { width: "100%", padding: "14px", backgroundColor: "#06b6d4", color: "#000", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(6,182,212,0.4)" },
  securityNote: { textAlign: "center", fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "12px" },
  successBox: { textAlign: "center", padding: "20px 10px" },
};
