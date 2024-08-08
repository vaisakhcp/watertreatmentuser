import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Modal, Typography, IconButton
} from '@mui/material';
import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const CoolingTowerChemicalsComponent = ({ updateData }) => {
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [technicianName, setTechnicianName] = useState('');
  const [coolingTowerChemicalsSignature, setCoolingTowerChemicalsSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);

  const [coolingTowerChemicalsLabels, setCoolingTowerChemicalsLabels] = useState([
    { label: 'Hydrochloric Acid (25Kg)', value: '', action: '' },
    { label: 'Sodium Hypochlorite (25Kg)', value: '', action: '' },
    { label: 'Phosphoric Acid (35Kg)', value: '', action: '' },
    { label: 'Expired CHW Chemicals', value: '', action: '' },
    { label: 'Expired CT Chemicals', value: '', action: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coolingTowerChemicals1'));
        const data = querySnapshot.docs.map(doc => doc.data());
        if (data.length > 0) {
          setCoolingTowerChemicalsLabels(data);
        }
      } catch (error) {
        console.error('Error fetching cooling tower chemicals data:', error);
      }
    };
    fetchData();
  }, []);

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

  const handleLabelChange = (index, label) => {
    const updatedLabels = [...coolingTowerChemicalsLabels];
    updatedLabels[index].label = label;
    setCoolingTowerChemicalsLabels(updatedLabels);
  };

  const handleValueChange = (index, value) => {
    const updatedData = [...coolingTowerChemicalsLabels];
    updatedData[index].value = value;
    setCoolingTowerChemicalsLabels(updatedData);
  };

  const handleActionChange = (index, action) => {
    const updatedData = [...coolingTowerChemicalsLabels];
    updatedData[index].action = action;
    setCoolingTowerChemicalsLabels(updatedData);
  };

  const handleAddRow = () => {
    setCoolingTowerChemicalsLabels([...coolingTowerChemicalsLabels, { label: '', value: '', action: '' }]);
  };

  const handleDeleteRow = (index) => {
    const updatedLabels = [...coolingTowerChemicalsLabels];
    updatedLabels.splice(index, 1);
    setCoolingTowerChemicalsLabels(updatedLabels);
  };

  const handleSaveData = async () => {
    const batch = writeBatch(db);
    coolingTowerChemicalsLabels.forEach((chemical, index) => {
      const docRef = doc(db, 'coolingTowerChemicals1', `chemical${index}`);
      batch.set(docRef, { label: chemical.label, value: chemical.value, action: chemical.action });
    });

    // Save the signature and technician name
    const signatureRef = doc(db, 'coolingTowerChemicals1', 'signature');
    batch.set(signatureRef, { signature: coolingTowerChemicalsSignature, technicianName: technicianName });
    // Save the signature and technician name
      // Save additionalData
    additionalTableData.forEach((item, index) => {
      const docRef = doc(db, 'additionalTable', `additionalItem${index}`);
      batch.set(docRef, { label: item.label, value: item.value, color: item.color });
    });

    await batch.commit();
    console.log('Data saved successfully!');
  };

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

  return (
    <>
      <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                Stocks
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Value
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                Actions
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coolingTowerChemicalsLabels.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell sx={{ padding: '8px' }}>
                  <TextField
                    value={item.label}
                    onChange={(e) => handleLabelChange(rowIndex, e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px' }}>
                  <TextField
                    value={item.value}
                    onChange={(e) => handleValueChange(rowIndex, e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px' }}>
                  <TextField
                    value={item.action}
                    onChange={(e) => handleActionChange(rowIndex, e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleDeleteRow(rowIndex)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRow}
                  fullWidth
                >
                  Add Row
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
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
      <Button variant="contained" color="primary" onClick={handleSaveData} sx={{ mt: 2 }}>
        Save Data
      </Button>
    </>
  );
};

export default CoolingTowerChemicalsComponent;
