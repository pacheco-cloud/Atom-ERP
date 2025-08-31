import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import api from '../api';

const SettingsPage = () => {
  const [settings, setSettings] = useState({ tax_rate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/configuration/settings/');
        setSettings(response.data);
      } catch (err) {
        setError('Não foi possível carregar as configurações.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/configuration/settings/', settings);
      setSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      setError('Falha ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Configurações da Empresa</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box component="form" noValidate autoComplete="off">
        <TextField
          label="Alíquota Padrão de Imposto (%)"
          name="tax_rate"
          type="number"
          value={settings.tax_rate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          helperText="Ex: 6 para 6%"
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SettingsPage;
