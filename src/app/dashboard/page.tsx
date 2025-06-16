import React from 'react'
import Box from '@mui/material/Box';

const Dashboard = () => {
    return (
        <Box component="section" display='flex' sx={{ p: 2, border: '1px dashed grey'}}>
            {/* left-part */}
            <Box component="section"  sx={{ p: 2, border: '1px dashed grey',width:'30%'}}>
               
            </Box>

            {/* right-part */}
            <Box component="section"  sx={{ p: 2, border: '1px dashed grey',width:'70%' }}></Box>
        </Box>
    )
}

export default Dashboard