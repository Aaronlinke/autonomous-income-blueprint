import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import AgentDashboard from '@/components/AgentDashboard.jsx'
import AnalyticsDashboard from '@/components/AnalyticsDashboard.jsx'
import { 
  TrendingUp, 
  Bot, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Zap, 
  Euro, 
  ArrowRight,
  CheckCircle,
  Mail,
  Globe,
  Smartphone,
  Settings
} from 'lucide-react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const handleSubscribe = (e) => {
    e.preventDefault()
    alert('Vielen Dank für Ihr Interesse! Die Newsletter-Funktion wird bald verfügbar sein.')
    setEmail('')
  }

  const handleContact = (e) => {
    e.preventDefault()
    alert('Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.')
    setEmail('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Autonomous Income Blueprint
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-2">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('overview')}
                  size="sm"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Überblick
                </Button>
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('dashboard')}
                  size="sm"
                  className={activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  KI-Agent
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('analytics')}
                  size="sm"
                  className={activeTab === 'analytics' ? 'bg-gradient-to-r from-orange-600 to-red-600' : ''}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </nav>
              <Badge variant="secondary" className="hidden sm:flex">
                <Zap className="w-3 h-3 mr-1" />
                Vollautomatisch
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <AgentDashboard />
        ) : activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {/* Hero Section */}
            <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              🚀 Autonomes Einkommen System
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Verdienen Sie Geld im Schlaf
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Entdecken Sie das ultimative Blueprint für passives Einkommen durch Krypto-Trading, 
              digitale Produkte und Affiliate-Marketing - alles vollautomatisch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                Jetzt starten
              </Button>
              <Button size="lg" variant="outline">
                <Globe className="w-5 h-5 mr-2" />
                Mehr erfahren
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Drei Säulen des Erfolgs</h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Unser System basiert auf bewährten Strategien, die bereits tausende von Menschen 
              zu finanzieller Freiheit geführt haben.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Krypto Bot */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-blue-900 dark:text-blue-100">Krypto-Trading Bot</CardTitle>
                <CardDescription>
                  Automatisierter Trading-Bot mit fortschrittlichen Algorithmen für optimale Gewinne.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    24/7 automatisches Trading
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Risikomanagement integriert
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Binance API Integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Docker-Container bereit
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" disabled>
                  <Bot className="w-4 h-4 mr-2" />
                  API-Schlüssel erforderlich
                </Button>
              </CardContent>
            </Card>

            {/* Digital Products */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900 dark:text-purple-100">Digitale Produkte</CardTitle>
                <CardDescription>
                  Verkaufen Sie E-Books, Templates und Kurse vollautomatisch über Gumroad.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Automatische E-Mail-Sequenzen
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Gumroad Integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Mailchimp Automatisierung
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Zapier Workflows
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" disabled>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Produkte hinzufügen
                </Button>
              </CardContent>
            </Card>

            {/* Affiliate Marketing */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-green-900 dark:text-green-100">Affiliate Marketing</CardTitle>
                <CardDescription>
                  Automatische Content-Erstellung und Social Media Posting für maximale Reichweite.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    KI-generierte Inhalte
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    WordPress Integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Automatisches Posting
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    OpenAI API Integration
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Content erstellen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-slate-800/50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                <BarChart3 className="w-3 h-3 mr-1" />
                Analytics & Tracking
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Messen Sie Ihren Erfolg</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Unser integriertes Tracking-System überwacht alle Ihre Einkommensströme in Echtzeit. 
                Von UTM-Links bis Google Analytics - Sie behalten immer den Überblick über Ihre Performance.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">UTM-Link Generator für präzises Tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">Google Analytics Integration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                    <Smartphone className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">Mobile Dashboard für unterwegs</span>
                </div>
              </div>
            </div>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-0">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">Tracking Dashboard</CardTitle>
                <CardDescription>Beispiel-Metriken Ihres autonomen Systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="font-medium">Krypto-Bot Gewinn</span>
                    <span className="text-green-600 font-bold">+€1,247</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="font-medium">Digitale Produkte</span>
                    <span className="text-green-600 font-bold">+€892</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="font-medium">Affiliate Provisionen</span>
                    <span className="text-green-600 font-bold">+€634</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Gesamt (30 Tage)</span>
                      <span className="text-green-600">+€2,773</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">Bleiben Sie auf dem Laufenden</CardTitle>
              <CardDescription className="text-blue-100">
                Erhalten Sie exklusive Updates und Tipps für passives Einkommen direkt in Ihr Postfach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Ihre E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                  required
                />
                <Button type="submit" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Mail className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Haben Sie Fragen?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Kontaktieren Sie uns für weitere Informationen über das Autonomous Income Blueprint.
            </p>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleContact} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Ihre E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Ihre Nachricht..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Nachricht senden
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Autonomous Income</h3>
              </div>
              <p className="text-slate-400">
                Das ultimative Blueprint für passives Einkommen durch Automatisierung und KI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Komponenten</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Krypto-Trading Bot</li>
                <li>Digitale Produkte</li>
                <li>Affiliate Marketing</li>
                <li>Analytics & Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Status</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  🔧 In Entwicklung
                </Badge>
                <p className="text-sm text-slate-400">
                  API-Integrationen und Automatisierungen werden schrittweise aktiviert.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Autonomous Income Blueprint. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
          </>
        )}
      </div>
    </div>
  )
}

export default App
