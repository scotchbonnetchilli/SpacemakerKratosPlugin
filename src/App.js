import './App.css';
import * as postRobot from "post-robot";
import React, {useCallback, useEffect, useState} from "react";
import UploadSpinner from "./upload.svg"
import Kratos from "./Kratos.jpeg"
import { RecoilRoot } from "recoil";
import {getSiteConfigKey} from "./utils";

// returns json promise which must be resolved
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  });

  return response.json();
}

function App() {
  const [buildingIdx, setBuildingIdx] = useState(0)
  useEffect(() => {
    postRobot.send(window.parent, 'setSceneType', "STATIC_BUILDINGS")
  }, [])

  const sendToKronos = useCallback(() => {
    const asyncThings = async () => {
      const siteConfig = (await postRobot.send(window.parent, 'getSiteConfig'))?.data
      const surroundingBuildings = getSiteConfigKey(siteConfig, "surrounding_building_barriers")
      const existingBuildings = getSiteConfigKey(siteConfig, "existing_building_barriers")
      const proposalGeometry = (await postRobot.send(window.parent, 'getProposalGeometry'))?.data

      console.log("Got surroundingBuildings", (surroundingBuildings?.features || []).length)
      console.log("Got existingBuildings", (existingBuildings?.features || []).length)
      console.log("Got proposalGeometry", proposalGeometry)
    }
    asyncThings()
  }, [])

  const colorBuilding0 = useCallback(() => {
    const asyncThings = async () => {
      await postRobot.send(window.parent, 'setColorOfBuilding', { buildingIndex: buildingIdx, color: [1, 0 ,0] })
      setBuildingIdx(buildingIdx+1)
    }
    asyncThings()
  }, [buildingIdx, setBuildingIdx])

  const getGltf = useCallback(() => {
    const asyncThings = async () => {
      const gltf = await postRobot.send(window.parent, 'getGeometry', "Analyze");

      // console.log(gltf.data);

      const numBuildings = gltf.data.scenes[0].nodes.length;
      console.log(`Analysing carbon footprint for ${numBuildings} buildings`);

      var design_settings = {};

      // slabSystemType {InsituConcreteOneWay, InsituConcreteTwoWay, PreCast, TimberFloor}
      // wallType {Concrete, Masonry, Timber}
      // beamMaterialType {concrete, masonry, timber, steel}
      // columnMaterialType {concrete, masonry, timber, steel}

      design_settings.slabSystemType = "InsituConcreteTwoWay";
      design_settings.wallType = "Concrete";
      design_settings.beamMaterialType = "steel";
      design_settings.columnMaterialType = "steel";

      // design_settings.slabSystemType = "InsituConcreteTwoWay";
      // design_settings.wallType = "Timber";
      // design_settings.beamMaterialType = "timber";
      // design_settings.columnMaterialType = "timber";

      var kratos_data = {};
      kratos_data.gltf_data = gltf.data;
      kratos_data.design_settings = design_settings;

      const startTime = performance.now();
      
      var val = await postData( '', kratos_data )
        .then(data => {

          const totalCarbonFootprint =  Math.round( data.totalCarbonFootprint );
          console.log(`Total carbon footprint = ${totalCarbonFootprint} kgCO2`);

          const endTime = performance.now();
          const carbonCostingTime = Math.round((endTime - startTime) / 1000);
          console.log(`Carbon costing took ${carbonCostingTime}s`);
        });
    }
    asyncThings()
  }, [])


  return (
    <RecoilRoot>
      <React.Suspense fallback={<img alt="loading spinner" src={UploadSpinner} />}>
        <div className="App">
          <img src={Kratos} alt={"ZUEEES"} />
          <button onClick={sendToKronos}>ZEUS!!</button>
          <button onClick={colorBuilding0}>BOY!!</button>
          <button onClick={getGltf}>Get Carbon Cost</button>
        </div>
      </React.Suspense>
    </RecoilRoot>
  );
}

export default App;
