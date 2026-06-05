import { LandingNav } from "./components/LandingNav";
import { TrustedBy } from "./components/TrustedBy";
import { CTA } from "./components/CTA";

import Cover from "./sections/Cover";
import Pillars from "./sections/Pillars";
import Problem from "./sections/Problem";
import TellerHero from "./sections/TellerHero";
import TellerDetail from "./sections/TellerDetail";
import MixedCheckoutFeature from "./sections/MixedCheckoutFeature";
import CashMovementFeature from "./sections/CashMovementFeature";
import OfflineFeature from "./sections/OfflineFeature";
import RecipeFeature from "./sections/RecipeFeature";
import ManagementHero from "./sections/ManagementHero";
import ManagementDetail from "./sections/ManagementDetail";
import Operations from "./sections/Operations";
import ExportFeature from "./sections/ExportFeature";
import SmartPricing from "./sections/SmartPricing";
import BuiltToFlex from "./sections/BuiltToFlex";
import RoadmapFeature from "./sections/RoadmapFeature";

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream font-sans text-navy antialiased">
      <LandingNav />
      
      <main className="pt-16">
        <Cover />
        <TrustedBy />
        <div id="pos-features">
          <Pillars pageIndex={1} />
          <Problem pageIndex={2} />
          <TellerHero pageIndex={3} />
          <TellerDetail pageIndex={4} />
          <MixedCheckoutFeature pageIndex={5} />
          <CashMovementFeature pageIndex={6} />
          <OfflineFeature pageIndex={7} />
          <RecipeFeature pageIndex={8} />
        </div>
        <div id="dashboard-features">
          <ManagementHero pageIndex={9} />
          <ManagementDetail pageIndex={10} />
          <Operations pageIndex={11} />
          <ExportFeature pageIndex={12} />
        </div>
        <div id="flexibility">
          <SmartPricing pageIndex={13} />
          <BuiltToFlex pageIndex={14} />
          <RoadmapFeature pageIndex={15} />
        </div>
        <div id="contact">
          <CTA />
        </div>
      </main>
    </div>
  );
}
