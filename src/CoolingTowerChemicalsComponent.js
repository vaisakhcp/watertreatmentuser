import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';

const CoolingTowerChemicalsComponent = ({ updateData }) => {
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const coolingTowerChemicalsLabels = [
    'Hydrochloric Acid (25Kg)', 'Sodium Hypochlorite (25Kg)', 'Phosphoric Acid (35Kg)',
    'Expired CHW Chemicals', 'Expired CT Chemicals'
  ];
  const coolingTowerChemicalsColumns = ['Available empty Jerry Cans in plants (06-11-2022)'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coolingTowerChemicals1'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoolingTowerChemicalsData(data);
      } catch (error) {
        console.error('Error fetching cooling tower chemicals data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <TableComponent
      collectionName="coolingTowerChemicals1"
      rowLabels={coolingTowerChemicalsLabels}
      columnLabels={coolingTowerChemicalsColumns}
      defaultRows={coolingTowerChemicalsData}
      updateData={updateData}
    />
  );
};

export default CoolingTowerChemicalsComponent;
