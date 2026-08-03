const fs = require('fs');

const file1 = 'src/features/admin/AdminDashboard.tsx';
fs.writeFileSync(file1, fs.readFileSync(file1, 'utf8').replace('dispatch(setPhase(variables));', 'dispatch(setPhase(variables as any));'));

const file2 = 'src/features/admin/PlayerListAdminPage.tsx';
fs.writeFileSync(file2, fs.readFileSync(file2, 'utf8').replace(/CardHeader, /g, '').replace(/CardTitle }/g, '}').replace(/'default'/g, '"primary"'));

const file3 = 'src/features/auth/LoginPage.tsx';
fs.writeFileSync(file3, fs.readFileSync(file3, 'utf8').replace(/const currentPhase = landingData\?\.data\?\.phase;/g, '// const currentPhase = landingData?.data?.phase;'));

const file4 = 'src/features/dashboard/components/PlayerDashboardRegistrationView.tsx';
fs.writeFileSync(file4, fs.readFileSync(file4, 'utf8').replace(/CardHeader, CardTitle }/g, '}').replace(/, refetch }/g, ' }'));

const file5 = 'src/features/landing/components/TournamentDashboardView.tsx';
fs.writeFileSync(file5, fs.readFileSync(file5, 'utf8').replace(/Users, /g, '').replace(/Tabs, TabsContent, /g, '').replace(/const allMatchesList =/g, '// const allMatchesList ='));
