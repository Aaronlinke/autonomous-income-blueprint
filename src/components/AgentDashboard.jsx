import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Play, 
  Pause, 
  TrendingUp, 
  DollarSign, 
  Target, 
  CheckCircle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react'

const AgentDashboard = () => {
  const [opportunities, setOpportunities] = useState([])
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    approvedOpportunities: 0,
    totalPotentialRevenue: 0,
    avgROI: 0
  })

  const API_BASE = 'http://localhost:3001/api'

  // Opportunities laden
  const loadOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/opportunities`)
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data)
        
        // Statistiken berechnen
        const totalRevenue = data.reduce((sum, opp) => sum + opp.potential_revenue, 0)
        const avgROI = data.length > 0 ? data.reduce((sum, opp) => sum + opp.roi_estimate, 0) / data.length : 0
        const approved = data.filter(opp => opp.status === 'approved').length
        
        setStats({
          totalOpportunities: data.length,
          approvedOpportunities: approved,
          totalPotentialRevenue: totalRevenue,
          avgROI: avgROI
        })
        
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Fehler beim Laden der Opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agent starten/stoppen
  const toggleAgent = async () => {
    try {
      const action = isAgentRunning ? 'stop' : 'start'
      const response = await fetch(`${API_BASE}/agent/${action}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setIsAgentRunning(!isAgentRunning)
        if (!isAgentRunning) {
          // Nach dem Start neue Opportunities laden
          setTimeout(loadOpportunities, 2000)
        }
      }
    } catch (error) {
      console.error('Fehler beim Steuern des Agenten:', error)
    }
  }

  // Opportunity genehmigen
  const approveOpportunity = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/opportunities/${id}/approve`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadOpportunities()
      }
    } catch (error) {
      console.error('Fehler beim Genehmigen:', error)
    }
  }

  // Risiko-Badge Farbe
  const getRiskColor = (riskScore) => {
    if (riskScore < 0.3) return 'bg-green-100 text-green-800'
    if (riskScore < 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // Initial laden
  useEffect(() => {
    loadOpportunities()
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(loadOpportunities, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">KI-Agent Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Autonome Einkommensgenerierung in Echtzeit
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleAgent}
            variant={isAgentRunning ? "destructive" : "default"}
            size="lg"
            className={isAgentRunning ? "" : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"}
          >
            {isAgentRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Agent stoppen
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Agent starten
              </>
            )}
          </Button>
          <Button
            onClick={loadOpportunities}
            variant="outline"
            size="lg"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      <Alert className={isAgentRunning ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <div className="flex items-center">
          {isAgentRunning ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Clock className="w-4 h-4 text-yellow-600" />
          )}
          <AlertDescription className="ml-2">
            {isAgentRunning ? (
              <span>
                <strong>Agent aktiv:</strong> Sucht kontinuierlich nach neuen Einkommensmöglichkeiten
                {lastUpdate && (
                  <span className="ml-2 text-sm text-slate-500">
                    (Letztes Update: {lastUpdate.toLocaleTimeString()})
                  </span>
                )}
              </span>
            ) : (
              <span>
                <strong>Agent inaktiv:</strong> Klicken Sie auf Agent starten um die autonome Suche zu beginnen
              </span>
            )}
          </AlertDescription>
        </div>
      </Alert>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedOpportunities} genehmigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potenzial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalPotentialRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Geschätzter Gesamtumsatz
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgROI.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Return on Investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAgentRunning ? (
                <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Inaktiv</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Agent-Status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Identifizierte Opportunities
          </CardTitle>
          <CardDescription>
            Vom KI-Agenten gefundene und analysierte Einkommensmöglichkeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Lade Opportunities...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Noch keine Opportunities gefunden. Starten Sie den Agenten, um die Suche zu beginnen.
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-4 h-4" />
                        <h3 className="font-semibold text-lg">{opp.title}</h3>
                        <Badge className={getRiskColor(opp.risk_score)}>
                          {opp.risk_score < 0.3 ? 'Niedriges' : opp.risk_score < 0.6 ? 'Mittleres' : 'Hohes'} Risiko
                        </Badge>
                        {opp.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Genehmigt
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-300 mb-3">
                        {opp.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-slate-500">Potenzial</span>
                          <div className="font-semibold text-green-600">€{opp.potential_revenue}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">ROI</span>
                          <div className="font-semibold">{opp.roi_estimate.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">Kategorie</span>
                          <div className="text-sm font-medium capitalize">
                            {opp.category.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {opp.status === 'pending' ? (
                        <Button
                          onClick={() => approveOpportunity(opp.id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Genehmigen
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          Aktiv seit {new Date(opp.approved_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentDashboard
