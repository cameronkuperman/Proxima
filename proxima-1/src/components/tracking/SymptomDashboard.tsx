'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSymptomTracking } from '@/hooks/useSymptomTracking'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart3,
  Target
} from 'lucide-react'
import { format } from 'date-fns'

export function SymptomDashboard() {
  const {
    loading,
    error,
    symptomHistory,
    symptomTrends,
    symptomSummary,
    fetchSymptomHistory,
    fetchSymptomTrends,
    fetchSymptomSummary,
    searchSymptoms,
    getSymptomsByBodyPart
  } = useSymptomTracking()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all')
  const [timeRange, setTimeRange] = useState(7)

  useEffect(() => {
    fetchSymptomHistory({ days: timeRange })
    fetchSymptomTrends(timeRange)
  }, [timeRange])

  const handleSearch = () => {
    if (searchTerm) {
      searchSymptoms(searchTerm, timeRange)
    } else {
      fetchSymptomHistory({ days: timeRange })
    }
  }

  const handleBodyPartFilter = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart)
    if (bodyPart === 'all') {
      fetchSymptomHistory({ days: timeRange })
    } else {
      getSymptomsByBodyPart(bodyPart, timeRange)
    }
  }

  const getTrendIcon = (trend: 'improving' | 'worsening' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-50'
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getChangeIcon = (change: 'new' | 'worsening' | 'improving') => {
    switch (change) {
      case 'new':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'worsening':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'improving':
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  if (loading && !symptomSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      {symptomSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{symptomSummary.total_symptoms}</div>
              <p className="text-xs text-gray-500 mt-1">
                {symptomSummary.unique_symptoms} unique
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Body Parts Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{symptomSummary.body_parts_affected.length}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {symptomSummary.body_parts_affected.slice(0, 3).map(part => (
                  <Badge key={part} variant="secondary" className="text-xs">
                    {part}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Most Frequent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {symptomSummary.most_frequent.slice(0, 2).map(symptom => (
                  <div key={symptom} className="text-sm font-medium truncate">
                    {symptom}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recent Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {symptomSummary.recent_changes.slice(0, 2).map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {getChangeIcon(change.change)}
                    <span className="text-sm truncate">{change.symptom}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Symptom Tracking</CardTitle>
          <CardDescription>
            Monitor and analyze your symptoms over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={selectedBodyPart} onValueChange={handleBodyPartFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by body part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Body Parts</SelectItem>
                {symptomSummary?.body_parts_affected.map(part => (
                  <SelectItem key={part} value={part}>{part}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {symptomTrends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {symptomTrends.map((trend, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {trend.symptom_name}
                      </CardTitle>
                      {getTrendIcon(trend.trend)}
                    </div>
                    <CardDescription>
                      {trend.body_part} • {trend.occurrences} occurrences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Average Severity</span>
                        <span className={`font-medium px-2 py-1 rounded ${getSeverityColor(trend.average_severity)}`}>
                          {trend.average_severity.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Trend</span>
                        <Badge variant={
                          trend.trend === 'improving' ? 'success' :
                          trend.trend === 'worsening' ? 'destructive' : 'secondary'
                        }>
                          {trend.trend}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              trend.trend === 'improving' ? 'bg-green-500' :
                              trend.trend === 'worsening' ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${(trend.average_severity / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
                <BarChart3 className="w-12 h-12 mb-2 text-gray-300" />
                <p>No symptom trends available</p>
                <p className="text-sm mt-1">Start tracking to see trends over time</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {symptomHistory.length > 0 ? (
            <div className="space-y-2">
              {symptomHistory.map((symptom) => (
                <Card key={symptom.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${
                        symptom.severity && symptom.severity > 6 ? 'bg-red-500' :
                        symptom.severity && symptom.severity > 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <div className="font-medium">{symptom.symptom_name}</div>
                        <div className="text-sm text-gray-500">
                          {symptom.body_part} • {format(new Date(symptom.occurrence_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {symptom.severity && (
                        <Badge variant="outline" className={getSeverityColor(symptom.severity)}>
                          Severity: {symptom.severity}/10
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {symptom.source}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
                <Clock className="w-12 h-12 mb-2 text-gray-300" />
                <p>No symptom history available</p>
                <p className="text-sm mt-1">Your tracked symptoms will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {symptomSummary && symptomSummary.recent_changes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Changes & Insights</CardTitle>
                <CardDescription>
                  Notable patterns and changes in your symptoms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {symptomSummary.recent_changes.map((change, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getChangeIcon(change.change)}
                      <div>
                        <div className="font-medium">{change.symptom}</div>
                        <div className="text-sm text-gray-500">
                          {change.change === 'new' && 'New symptom detected'}
                          {change.change === 'worsening' && 'Symptom is worsening'}
                          {change.change === 'improving' && 'Symptom is improving'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
                <Target className="w-12 h-12 mb-2 text-gray-300" />
                <p>No insights available yet</p>
                <p className="text-sm mt-1">Track symptoms regularly to generate insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}