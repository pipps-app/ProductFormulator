import fetch from 'node-fetch';

async function testFormulationAPI() {
  try {
    // First, let's get the list of formulations
    console.log('=== Testing Formulations List ===');
    const listResponse = await fetch('http://localhost:5000/api/formulations', {
      headers: {
        'Content-Type': 'application/json',
        // You might need to add authorization header if required
      }
    });
    
    if (!listResponse.ok) {
      console.log('List API failed:', listResponse.status, listResponse.statusText);
      return;
    }
    
    const formulations = await listResponse.json();
    console.log('Found formulations:', formulations.length);
    
    if (formulations.length > 0) {
      const firstFormulation = formulations[0];
      console.log('\nFirst formulation summary:');
      console.log('- ID:', firstFormulation.id);
      console.log('- Name:', firstFormulation.name);
      console.log('- Total Cost:', firstFormulation.totalCost, '(type:', typeof firstFormulation.totalCost, ')');
      console.log('- Unit Cost:', firstFormulation.unitCost, '(type:', typeof firstFormulation.unitCost, ')');
      console.log('- Target Price:', firstFormulation.targetPrice, '(type:', typeof firstFormulation.targetPrice, ')');
      
      // Now test the individual formulation endpoint
      console.log('\n=== Testing Individual Formulation ===');
      const detailResponse = await fetch(`http://localhost:5000/api/formulations/${firstFormulation.id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!detailResponse.ok) {
        console.log('Detail API failed:', detailResponse.status, detailResponse.statusText);
        const errorText = await detailResponse.text();
        console.log('Error response:', errorText);
        return;
      }
      
      const detailData = await detailResponse.json();
      console.log('\nFormulation detail:');
      console.log('- ID:', detailData.id);
      console.log('- Name:', detailData.name);
      console.log('- Total Cost:', detailData.totalCost, '(type:', typeof detailData.totalCost, ')');
      console.log('- Unit Cost:', detailData.unitCost, '(type:', typeof detailData.unitCost, ')');
      console.log('- Target Price:', detailData.targetPrice, '(type:', typeof detailData.targetPrice, ')');
      console.log('\nFull formulation object:');
      console.log(JSON.stringify(detailData, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testFormulationAPI();
