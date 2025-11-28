// Test fixture for slow but normal completion (no hang)
console.log('Starting slow execution');

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy wait
  }
}

let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += i;
  sleep(100); // Sleep 100ms between iterations
}

console.log('Sum:', sum);
console.log('Completed successfully');
