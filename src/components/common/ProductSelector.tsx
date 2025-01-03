import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { ProductDefinition } from '../../types';

interface ProductSelectorProps {
  value: ProductDefinition | null;
  onChange: (product: ProductDefinition | null) => void;
  suggestedProducts?: ProductDefinition[];
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export default function ProductSelector({
  value,
  onChange,
  suggestedProducts = [],
  error,
  helperText,
  disabled,
}: ProductSelectorProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      options={suggestedProducts}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(option) =>
        `${option.name} (${option.code})`
      }
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              کد: {option.code}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={option.saleDepartment}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={option.productionSegment}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="محصول"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      filterOptions={(options, { inputValue }) => {
        const searchText = inputValue.toLowerCase();
        return options.filter(
          (option) =>
            option.name.toLowerCase().includes(searchText) ||
            option.code.toLowerCase().includes(searchText)
        );
      }}
    />
  );
} 