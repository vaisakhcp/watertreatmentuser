import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';
import {
    Container, Box, Tabs, Tab, Paper, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    createTheme, ThemeProvider, Modal, Typography, Grid, useMediaQuery,
    List, ListItem, ListItemText, IconButton, Divider, Chip, Fab, CircularProgress, Backdrop
  } from '@mui/material';
const CoolingTowerChemicalsComponent = ({ updateData,columnLabels }) => {
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const coolingTowerChemicalsLabels = [
    'Hydrochloric Acid (25Kg)', 'Sodium Hypochlorite (25Kg)', 'Phosphoric Acid (35Kg)',
    'Expired CHW Chemicals', 'Expired CT Chemicals'
  ];
  const [additionalTableData, setAdditionalTableData] = useState([
    { label: 'Condenser water dip slide test result as of: 30th October 2022', value: '', color: 'blue' },
    { label: 'Chilled water dip slide test result as of: 02nd November 2022', value: '', color: 'blue' },
    { label: 'Condenser system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'Condenser system Blowdown (m³ / USG)', value: '', color: 'red' },
    { label: 'Chilled water system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'C.O.C based on conductivity (Condenser/Make-up)', value: '', color: 'blue' },
    { label: 'C.O.C based on (CT make-up/CT blowdown)', value: '', color: 'blue' },
    { label: 'MIOX Running Hours (Hr.)', value: '', color: 'black' },
  ]);
  const handleAdditionalTableChange = (e, index) => {
    const newTableData = [...additionalTableData];
    newTableData[index].value = e.target.value;
    setAdditionalTableData(newTableData);
  };

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
      <>
    <TableComponent
      collectionName="coolingTowerChemicals1"
      rowLabels={coolingTowerChemicalsLabels}
      columnLabels={columnLabels}
      defaultRows={coolingTowerChemicalsData}
      updateData={updateData}
            />
              <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
            <Table>
              <TableBody>
                {additionalTableData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      {index < 2 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">10<sup></sup></Typography>
                          <TextField
                            value={item.value}
                            onChange={(e) => handleAdditionalTableChange(e, index)}
                            sx={{ width: '56px', ml: 1 }}
                            InputProps={{
                              inputProps: { style: { textAlign: 'center' } }
                            }}
                          />
                        </Box>
                      ) : (
                        <TextField
                          value={item.value}
                          onChange={(e) => handleAdditionalTableChange(e, index)}
                          fullWidth
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </>
  );
};

export default CoolingTowerChemicalsComponent;
