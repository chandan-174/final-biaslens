import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import DashboardPreview from "@/pages/DashboardPreview";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import blogs from "@/data/blogs";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setBlogs(data);
  };

  fetchBlogs();
}, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-background text-foreground overflow-hidden">

      {/* 🔥 PREMIUM NAVBAR */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-border
        ${scrolled
          ? "bg-background/80 backdrop-blur-xl shadow-md"
          : "bg-background/40 backdrop-blur-lg"}
        `}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* LOGO */}
          <div className="text-lg font-bold tracking-tight cursor-pointer hover:opacity-80 transition">
            BiasLens
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">

            <NavItem to="/">Home</NavItem>
            <NavItem to="#features">Features</NavItem>
            <NavItem to="#pricing">Pricing</NavItem>

            <ThemeToggle compact />

            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition">
              Login
            </Link>

            {/* GLOW BUTTON */}
            <Link to="/signup">
              <button className="relative px-5 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 blur-md opacity-70 group-hover:opacity-100 transition"></span>
                <span className="relative z-10">Get Started</span>
              </button>
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* 📱 MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border z-40"
          >
            <div className="flex flex-col items-center gap-6 py-6">

              <NavItem to="/" onClick={() => setOpen(false)}>Home</NavItem>
              <NavItem to="/features" onClick={() => setOpen(false)}>Features</NavItem>
              <NavItem to="/pricing" onClick={() => setOpen(false)}>Pricing</NavItem>

              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>

              <Link to="/signup" onClick={() => setOpen(false)}>
                <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  Get Started
                </button>
              </Link>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-150px] left-[-100px] w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full" />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-extrabold leading-tight">
            AI Powered
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
              {" "}Decision Intelligence
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Transform raw datasets into meaningful insights, detect hidden biases,
            and make smarter academic and business decisions.
          </p>

          <div className="mt-8 flex gap-4">
            <Link to="/signup">
              <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-xl hover:scale-105 transition flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </button>
            </Link>

            <button className="px-6 py-3 rounded-xl border border-border hover:bg-accent transition">
              Watch Demo
            </button>
          </div>

          {/* STATS */}
          <div className="mt-10 flex gap-10 text-sm text-muted-foreground">
            <div><div className="text-xl font-bold text-foreground">10K+</div>Users</div>
            <div><div className="text-xl font-bold text-foreground">500+</div>Datasets</div>
            <div><div className="text-xl font-bold text-foreground">99%</div>Accuracy</div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <DashboardPreview />
        </motion.div>

      </section>

      {/* 🚀 PREMIUM FEATURES WITH FLIP */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Built for Intelligent Decisions
        </motion.h2>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-8">
          

          {[
            {
              title: "Data Visualization",
              desc: "Interactive charts, KPIs, and real-time insights.",
              icon: "📊",
              preview: "Live charts update instantly with incoming data.",
              mini: "📈 Growth: +32%",
            },
            {
              title: "Bias Detection",
              desc: "Detect skew, imbalance, and anomalies.",
              icon: "⚠️",
              preview: "System highlights imbalance in dataset.",
              mini: "⚠️ Risk: Medium",
            },
            {
              title: "Smart Recommendations",
              desc: "AI suggests improvements.",
              icon: "💡",
              preview: "AI suggests cleaning missing values.",
              mini: "💡 Normalize data",
            },
            {
              title: "AI Assistant",
              desc: "Chat with your data.",
              icon: "🤖",
              preview: "Ask questions like ChatGPT.",
              mini: "You: Why skew?",
            },
            {
              title: "Fast CSV Upload",
              desc: "Upload instantly.",
              icon: "⚡",
              preview: "Drag & drop CSV for instant analysis.",
              mini: "Upload: success.csv",
            },
            {
              title: "Decision Reports",
              desc: "Generate reports.",
              icon: "📄",
              preview: "Export structured reports.",
              mini: "Report Ready ✔",
            },
            
          ].map((f, i) => (
            <FlipCard
             key={i}
             data={f}
              isActive={activeCard === i}
              onClick={() =>
                setActiveCard(activeCard === i ? null : i)
              }
             />
          ))}

  </div>
</section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 text-center">

        <h2 className="text-4xl font-bold mb-12">
          Simple, Transparent Pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          {[
            {
              name: "Starter",
              price: "Free",
              features: [
                "Basic data analysis",
                "Limited uploads",
                "Community support",
              ],
            },
            {
              name: "Pro",
              price: "₹499/mo",
              highlight: true,
              features: [
                "Advanced analytics",
                "Bias detection",
                "AI recommendations",
                "Priority support",
              ],
            },
            {
              name: "Enterprise",
              price: "Custom",
              features: [
                "Unlimited data",
                "Team access",
                "Custom integrations",
                "Dedicated support",
              ],
            },
            
          ].map((plan, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className={`p-8 rounded-2xl border ${plan.highlight
                  ? "border-blue-500 bg-blue-500/10 shadow-xl"
                  : "border-border bg-card/60"
                } backdrop-blur-xl`}
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-4">{plan.price}</p>

              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((f, idx) => (
                  <li key={idx}>✔ {f}</li>
                ))}
              </ul>

              <button className="mt-6 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:scale-105 transition">
                Get Started
              </button>
            </motion.div>
          ))}

        </div>
      </section>

      {/* 📝 BLOG SECTION */}
      <section id="blog" className="relative mx-auto max-w-7xl px-6 py-24">

        {/* TITLE */}
        <h2 className="text-4xl font-bold text-center mb-16">
          Latest Insights & Blogs
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {blogs.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="cursor-pointer p-6 rounded-2xl border border-border bg-card/60 hover:scale-[1.02] transition"
            >
              <h3 className="font-semibold text-lg">{post.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.description}
              </p>
              {post.image && (
                <img
                  src={post.image}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 👥 TEAM SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">

        <h2 className="text-4xl font-bold mb-16">
          Meet Our Team
        </h2>

        <div className="grid md:grid-cols-5 gap-8">

          {[
            "Chandan Sharma",
            "Diksha Sharma",
            "Ayush Sharma",
            "Akanksha Sharma",
          ].map((name, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-lg hover:scale-105 transition"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                {name[0]}
              </div>

              <h3 className="mt-4 font-semibold">{name}</h3>
              <p className="text-xs text-muted-foreground">
                Developer
              </p>
            </div>
          ))}

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-border bg-background/60 backdrop-blur-xl">

        {/* GLOW */}
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[500px] h-[200px] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8 text-sm">

          {/* BRAND */}
          <div>
            <h3 className="text-lg font-semibold mb-3">BiasLens</h3>
            <p className="text-muted-foreground">
              AI-powered platform for smarter decisions and bias-free insights.
            </p>
          </div>

          {/* LINKS */}
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h4 className="font-semibold mb-3">Follow Us</h4>
            <div className="flex gap-4 text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer">🐦</span>
              <span className="hover:text-foreground cursor-pointer">💼</span>
              <span className="hover:text-foreground cursor-pointer">📸</span>
            </div>
          </div>

        </div>

        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © 2026 BiasLens. Built with team ❤️
        </div>
      </footer>
    </div>
  );
}

/* NAV ITEM */
function NavItem({ to, children, onClick }: any) {
  const handleClick = (e: any) => {
    if (to.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(to);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    if (onClick) onClick();
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className="relative text-sm text-muted-foreground hover:text-foreground transition group"
    >
      {children}
      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
    </a>
  );
}

function FlipCard({ data, isActive, onClick }: any) {
  return (
    <div
      className="perspective cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`relative w-full h-[200px] transition-transform duration-700 transform-style ${
          isActive ? "rotate-y-180" : ""
        }`}
      >

        {/* FRONT */}
        <div
          className={`absolute w-full h-full backface-hidden p-6 rounded-2xl border border-border backdrop-blur-xl shadow-lg transition ${
            isActive ? "bg-card/30" : "bg-card/60"
          }`}
        >
          <div className="text-3xl mb-4">{data.icon}</div>
          <h3 className="font-semibold text-lg">{data.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.desc}
          </p>
        </div>

        {/* BACK */}
        <div
          className={`absolute w-full h-full backface-hidden rotate-y-180 p-6 rounded-2xl border border-border backdrop-blur-xl shadow-lg transition ${
            isActive
              ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
              : "bg-background/80"
          }`}
        >
          <div className="text-sm font-semibold mb-2">
            {data.title} Preview
          </div>

          <div className="text-xs text-muted-foreground">
            {data.preview}
          </div>

          <div className="mt-3 text-xs bg-card p-2 rounded border border-border">
            {data.mini}
          </div>
        </div>

      </div>
    </div>
  );
}