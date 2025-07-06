import {
    Box,
    Typography,
    Collapse,
    Slider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { type ApiConfig } from './types';

interface ApiConfigurationProps {
    show: boolean;
    apiConfig: ApiConfig;
    setApiConfig: (config: ApiConfig) => void;
}

export function ApiConfiguration({ show, apiConfig, setApiConfig }: ApiConfigurationProps) {
    return (
        <Collapse in={show}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>
                    Generation Parameters
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Temperature: {apiConfig.temperature}
                        </Typography>
                        <Slider
                            value={apiConfig.temperature}
                            onChange={(_, value) => setApiConfig({ ...apiConfig, temperature: value as number })}
                            min={0}
                            max={1}
                            step={0.1}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Min Score: {apiConfig.minScore}
                        </Typography>
                        <Slider
                            value={apiConfig.minScore}
                            onChange={(_, value) => setApiConfig({ ...apiConfig, minScore: value as number })}
                            min={0}
                            max={1}
                            step={0.1}
                            size="small"
                        />
                    </Box>
                    <TextField
                        label="Number of Chunks"
                        type="number"
                        size="small"
                        value={apiConfig.numChunks}
                        onChange={(e) => setApiConfig({ ...apiConfig, numChunks: parseInt(e.target.value) || 3 })}
                        inputProps={{ min: 1, max: 10 }}
                    />
                    <FormControl size="small">
                        <InputLabel>Search Type</InputLabel>
                        <Select
                            value={apiConfig.type}
                            label="Search Type"
                            onChange={(e) => setApiConfig({ ...apiConfig, type: e.target.value })}
                        >
                            <MenuItem value="all">All Documents</MenuItem>
                            <MenuItem value="recent">Recent Only</MenuItem>
                            <MenuItem value="relevant">Most Relevant</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        </Collapse>
    );
}
