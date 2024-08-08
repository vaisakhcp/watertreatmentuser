import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Modal, Typography, IconButton, Link, Popper
} from '@mui/material';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const CoolingTowerChemicalsComponent = ({ updateData }) => {
  const [coolingTowerChemicalsLabels, setCoolingTowerChemicalsLabels] = useState([
    { label: 'Hydrochloric Acid (25Kg)', value: '', action: '' },
    { label: 'Sodium Hypochlorite (25Kg)', value: '', action: '' },
    { label: 'Phosphoric Acid (35Kg)', value: '', action: '' },
    { label: 'Expired CHW Chemicals', value: '', action: '' },
    { label: 'Expired CT Chemicals', value: '', action: '' }
  ]);

  const [additionalDataTable, setAdditionalDataTable] = useState([
    { label: 'Condenser water dip slide test result as of: ', value: '', type: 'date' },
    { label: 'Chilled water dip slide test result as of: ', value: '', type: 'date' },
    { label: 'Condenser system Make-up (m³ / USG)', value: '' },
    { label: 'Condenser system Blowdown (m³ / USG)', value: '' },
    { label: 'Chilled water system Make-up (m³ / USG)', value: '' },
    { label: 'C.O.C based on conductivity (Condenser/Make-up)', value: '' },
    { label: 'C.O.C based on (CT make-up/CT blowdown)', value: '' },
    { label: 'MIOX Running Hours (Hr.)', value: '' },
  ]);

  const [technicianName, setTechnicianName] = useState('');
  const [coolingTowerChemicalsSignature, setCoolingTowerChemicalsSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ label: '', value: '', action: '' });

  const handleOpenDatePicker = (event, index) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setSelectedDateIndex(index);
    setOpenDatePicker(true);
  };

  const handleDateChange = (newDate) => {
    const updatedDates = { ...selectedDates, [selectedDateIndex]: newDate };
    setSelectedDates(updatedDates);
    setOpenDatePicker(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coolingTowerChemicals1'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) {
          const chemicalsData = data.filter(item => !item.type || item.type !== 'additionalDataTable');
          const additionalData = data.filter(item => item.type === 'additionalDataTable');
          setCoolingTowerChemicalsLabels(chemicalsData.length ? chemicalsData : coolingTowerChemicalsLabels);
          setAdditionalDataTable(additionalData.length ? additionalData : additionalDataTable);
        }
      } catch (error) {
        console.error('Error fetching cooling tower chemicals data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateData('additionalDataTable', additionalDataTable);
    updateData('coolingTowerChemicals1', coolingTowerChemicalsLabels);
  }, [coolingTowerChemicalsLabels, additionalDataTable, updateData]);

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

  const handleTechnichianName = async (e) => {
    setTechnicianName(e.target.value);
    const docRef = doc(db, 'coolingTowerChemicals1', 'technicianName');
    await setDoc(docRef, { name: e.target.value });
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
    setOpenAddProductModal(true);
  };

  const handleAddProduct = async () => {
    const updatedLabels = [...coolingTowerChemicalsLabels, newProduct];
    setCoolingTowerChemicalsLabels(updatedLabels);

    await setDoc(doc(db, 'coolingTowerChemicals1', `product-${updatedLabels.length}`), newProduct);

    setNewProduct({ label: '', value: '', action: '' });
    setOpenAddProductModal(false);
  };

  const handleDeleteRow = async (index) => {
    const updatedLabels = [...coolingTowerChemicalsLabels];
    const deletedItem = updatedLabels.splice(index, 1);
    setCoolingTowerChemicalsLabels(updatedLabels);

    await setDoc(doc(db, 'coolingTowerChemicals1', `product-${index + 1}`), deletedItem);
  };

  const handleAdditionalTableChange = (e, index) => {
    const newTableData = [...additionalDataTable];
    newTableData[index].value = e.target.value;
    setAdditionalDataTable(newTableData);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                Products
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
                  <Typography>{item.label}</Typography>
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
            {additionalDataTable.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {item.label}
                  {item.type === 'date' && (
                    <Link href="#" onClick={(event) => handleOpenDatePicker(event, index)}>
                      {selectedDates[index] ? selectedDates[index].toLocaleDateString() : 'Select Date'}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {item.type === 'date' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">10<sup></sup></Typography>
                      <TextField
                        value={item.value}
                        onChange={(e) => {
                          const newTableData = [...additionalDataTable];
                          newTableData[index + 2].value = e.target.value;
                          setAdditionalDataTable(newTableData);
                        }}
                        sx={{ width: '56px', ml: 1 }}
                        InputProps={{
                          inputProps: { style: { textAlign: 'center' } }
                        }}
                      />
                    </Box>
                  ) : (
                    <TextField
                      value={item.value}
                      onChange={(e) => {
                        const newTableData = [...additionalDataTable];
                        newTableData[index].value = e.target.value;
                        setAdditionalDataTable(newTableData);
                      }}
                      fullWidth
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Popper open={openDatePicker} anchorEl={anchorEl}>
        <Paper>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={selectedDates[selectedDateIndex] || null}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </Paper>
      </Popper>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
        <TextField
          label="Name"
          value={technicianName}
          onChange={handleTechnichianName}
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

      <Modal
        open={openAddProductModal}
        onClose={() => setOpenAddProductModal(false)}
        aria-labelledby="add-product-modal-title"
        aria-describedby="add-product-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography id="add-product-modal-title" variant="h6" component="h2" gutterBottom>
            Add New Product
          </Typography>
          <TextField
            label="Product Label"
            value={newProduct.label}
            onChange={(e) => setNewProduct({ ...newProduct, label: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Value"
            value={newProduct.value}
            onChange={(e) => setNewProduct({ ...newProduct, value: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Action"
            value={newProduct.action}
            onChange={(e) => setNewProduct({ ...newProduct, action: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleAddProduct} sx={{ mt: 2 }}>
            Add Product
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default CoolingTowerChemicalsComponent;
