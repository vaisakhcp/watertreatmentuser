import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Breadcrumbs,
  CircularProgress,
  Divider,
  Button,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: blue[700],
    },
    background: {
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#5f6368',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
  },
});

const AdminDetail = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'shiftHandOvers', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSubmission(docSnap.data());
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const downloadPDF = () => {
    const input = document.getElementById('pdf-content');
    html2canvas(input)
      .then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('report.pdf');
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component={Paper} sx={{ p: 3, mt: 3, backgroundColor: theme.palette.background.paper }} style={{ marginBottom: 60 }}>
        <Box id="pdf-content">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <img src={require('./logo.png')} alt="Logo" style={{ height: '50px' }} />
            </Box>
            <Box>
              <Typography variant="h1" component="h1" gutterBottom>
                Daily Shift Hand Over Form
              </Typography>
            </Box>
          </Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link to="/admin" style={{ color: theme.palette.primary.main }}>Admin Panel</Link>
            <Typography color="textPrimary">Submission Details</Typography>
          </Breadcrumbs>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress color="primary" />
            </Box>
          ) : submission ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1"><strong>Plant Name:</strong> {submission.plantName}</Typography>
                  <Typography variant="body1"><strong>Date:</strong> {submission.date}</Typography>
                  <Typography variant="body1"><strong>Time:</strong> {submission.time}</Typography>
                  <Typography variant="body1"><strong>Shift:</strong> {submission.shift}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h3" component="h3" gutterBottom>
                Plant Status
              </Typography>
              <Table sx={{ mb: 3, border: '1px solid #ddd' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', padding: '10px', border: '1px solid #ddd' }}>Equipment List</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '10px', border: '1px solid #ddd' }}>Plant Actual Parameters</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '10px', border: '1px solid #ddd' }}>Status / Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submission.equipmentStatus.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ padding: '10px', border: '1px solid #ddd' }}>{item.equipment}</TableCell>
                      <TableCell sx={{ padding: '10px', border: '1px solid #ddd' }}>{item.parameters}</TableCell>
                      <TableCell sx={{ padding: '10px', border: '1px solid #ddd' }}>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h3" component="h3" gutterBottom>
                Activities
              </Typography>
              <Box sx={{ mb: 2 }}>
                <ul>
                  {submission.activities.map((activity, index) => (
                    <li key={index}>
                      <Typography variant="body1">{activity}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h3" component="h3" gutterBottom>
                Equipment not Available
              </Typography>
              <Box sx={{ mb: 2 }}>
                <ul>
                  {submission.equipmentNotAvailable.map((equipment, index) => (
                    <li key={index}>
                      <Typography variant="body1">{equipment}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>

              <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: '4px',
                    backgroundColor: theme.palette.background.default,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '1rem',height:100 }}>
                      I confirm that I have explained the plant status and activities carried out during my shift to the replacing operator.
                    </Typography>
                    {submission.operatorSignature && (
                      <img
                        src={submission.operatorSignature}
                        alt="Operator Signature"
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          border: '1px solid #000',
                          height: '150px', // Fixed height for the image
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    <Typography variant="body1" sx={{ mt: 2, fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Operator Signature
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>{submission.operatorName}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>{submission.operatorDate}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: '4px',
                    backgroundColor: theme.palette.background.default,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '1rem',height:100 }}>
                      I confirm that I understand plant status and activities carried out as explained by the shift operator.
                    </Typography>
                    {submission.supervisorSignature && (
                      <img
                        src={submission.supervisorSignature}
                        alt="Supervisor Signature"
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          border: '1px solid #000',
                          height: '150px', // Fixed height for the image
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    <div>
                      <Typography variant="body1" sx={{ mt: 2, fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Supervisor Signature
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{submission.supervisorName}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{submission.supervisorDate}</Typography>
                    </div>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography variant="body1" gutterBottom>Loading...</Typography>
          )}
        </Box>
        <Button variant="contained" color="primary" onClick={downloadPDF} sx={{ mt: 2 }}>
          Download Report as PDF
        </Button>
        <Link to="/admin" style={{ color: theme.palette.primary.main, marginTop: '20px', display: 'block' }}>Back to List</Link>
      </Container>
    </ThemeProvider>
  );
};

export default AdminDetail;
