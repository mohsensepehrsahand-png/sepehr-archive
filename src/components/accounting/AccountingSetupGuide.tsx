"use client";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  AccountTree,
  PlayArrow,
  Stop,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';

interface AccountingSetupGuideProps {
  projectId: string;
  currentStep: 'coding' | 'opening' | 'closing';
}

export default function AccountingSetupGuide({ projectId, currentStep }: AccountingSetupGuideProps) {
  const steps = [
    {
      label: 'ایجاد کدینگ حسابداری',
      description: 'ابتدا باید حساب‌های حسابداری پروژه را ایجاد کنید',
      icon: <AccountTree />,
      action: 'رفتن به کدینگ حسابداری',
      href: `/accounting/${projectId}?tab=0`
    },
    {
      label: 'ثبت سند افتتاحیه',
      description: 'مانده اول دوره حساب‌ها را ثبت کنید',
      icon: <PlayArrow />,
      action: 'رفتن به سند افتتاحیه',
      href: `/accounting/${projectId}?tab=2`
    },
    {
      label: 'ثبت سند اختتامیه',
      description: 'در پایان سال مالی، حساب‌ها را ببندید',
      icon: <Stop />,
      action: 'رفتن به سند اختتامیه',
      href: `/accounting/${projectId}?tab=3`
    }
  ];

  const getStepStatus = (stepIndex: number) => {
    if (currentStep === 'coding' && stepIndex === 0) return 'active';
    if (currentStep === 'opening' && stepIndex === 1) return 'active';
    if (currentStep === 'closing' && stepIndex === 2) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    if (status === 'active') return <Info color="primary" />;
    if (status === 'completed') return <CheckCircle color="success" />;
    return <Warning color="disabled" />;
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            راهنمای راه‌اندازی سیستم حسابداری
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            برای استفاده از سیستم حسابداری، باید مراحل زیر را به ترتیب انجام دهید:
          </Alert>

          <Stepper orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index} active={getStepStatus(index) === 'active'}>
                <StepLabel
                  icon={getStepIcon(index)}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: getStepStatus(index) === 'active' ? 'bold' : 'normal'
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {step.description}
                  </Typography>
                  
                  {getStepStatus(index) === 'active' && (
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={step.icon}
                        onClick={() => window.location.href = step.href}
                        sx={{
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          mb: 2
                        }}
                      >
                        {step.action}
                      </Button>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            اطلاعات مورد نیاز برای سند افتتاحیه:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="مانده اول دوره دارایی‌ها"
                secondary="صندوق، بانک، موجودی کالا، حساب‌های دریافتنی و سایر دارایی‌ها"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="مانده اول دوره بدهی‌ها"
                secondary="حساب‌های پرداختنی، وام‌ها، پیش‌دریافت‌ها و سایر بدهی‌ها"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="سرمایه اولیه"
                secondary="مبلغ سرمایه اولیه شرکت یا مانده حقوق صاحبان سهام"
              />
            </ListItem>
          </List>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              <strong>نکته مهم:</strong> سند افتتاحیه باید تراز باشد. یعنی جمع مانده‌های بدهکار باید برابر جمع مانده‌های بستانکار باشد.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}


