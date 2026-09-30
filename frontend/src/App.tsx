import React from "react";
import { useStore } from "./store/useStore";
import { NavigationRail } from "./components/NavigationRail";
import { TopBar } from "./components/TopBar";
import { TokenDemoPage } from "./features/tokens/TokenDemoPage";
import { CommandCenter } from "./features/command-center/CommandCenter";
import { AssetExplorer } from "./features/assets/AssetExplorer";
import { NLPStudio } from "./features/complaints/NLPStudio";
import { PredictiveAnalytics } from "./features/predictive/PredictiveAnalytics";
import { PrioritizationBoard } from "./features/priority/PrioritizationBoard";
import { PlannerStudio } from "./features/planner/PlannerStudio";
import { WhatIfSimulator } from "./features/simulator/WhatIfSimulator";
import { SensorMonitor } from "./features/sensors/SensorMonitor";
import { WardEquity } from "./features/wards/WardEquity";
import { DataModelHealth } from "./features/admin/DataModelHealth";
import { CitizenPostView } from "./features/citizen/CitizenPostView";
import { AdminMapView } from "./features/admin/AdminMapView";
import { FieldCrewView } from "./features/field/FieldCrewView";

export const App: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const role = useStore((s) => s.role);

  const renderContent = () => {
    switch (activeTab) {
      case "command-center":
        return role === "admin" ? <AdminMapView /> : <CitizenPostView />;
      case "citizen":
        return <CitizenPostView />;
      case "admin":
        return <AdminMapView />;
      case "assets":
        return <AssetExplorer />;
      case "complaints":
        return <NLPStudio />;
      case "predictive":
        return <PredictiveAnalytics />;
      case "priority":
        return <PrioritizationBoard />;
      case "planner":
        return <PlannerStudio />;
      case "simulator":
        return <WhatIfSimulator />;
      case "sensors":
        return <SensorMonitor />;
      case "wards":
        return <WardEquity />;
      case "field":
        return <FieldCrewView />;
      case "tokens":
      default:
        return <TokenDemoPage />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <NavigationRail />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
