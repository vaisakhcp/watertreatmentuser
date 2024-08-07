import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';
import {
  Container, Box, Tabs, Tab, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableRow,
  Modal, Typography, useMediaQuery, List, ListItem, Divider, Grid
} from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const CoolingTowerChemicalsComponent = ({ updateData, columnLabels }) => {
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [technicianName, setTechnicianName] = useState('');
  const [coolingTowerChemicalsSignature, setCoolingTowerChemicalsSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);

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

  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setCoolingTowerChemicalsSignature(signatureDataUrl);
    setOpenSignatureModal(false);

    // Save the signature to the database
    const docRef = doc(db, 'coolingTowerChemicals1', 'signature');
    await setDoc(docRef, { signature: signatureDataUrl });
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
        <TextField
          label="Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid lightgrey',
            cursor: 'pointer',
            height: '50px',
          }}
          onClick={handleOpenSignatureModal}
        >
          {coolingTowerChemicalsSignature ? (
            <img src={coolingTowerChemicalsSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
          ) : (
            'Sign'
          )}
        </Box>
      </Box>
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
      <Modal
        open={openSignatureModal}
        onClose={() => setOpenSignatureModal(false)}
        aria-labelledby="signature-modal-title"
        aria-describedby="signature-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography id="signature-modal-title" variant="h6" component="h2" gutterBottom>
            Signature
          </Typography>
          <Box sx={{ width: '100%', height: 200, border: '1px solid #000' }}>
            <SignaturePad ref={sigPadRef} canvasProps={{ style: { width: '100%', height: '100%' } }} />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="contained" color="primary" onClick={handleSign}>
              Sign
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default CoolingTowerChemicalsComponent;
