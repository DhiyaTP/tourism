fetch("/api/places")
  .then(res => res.json())
  .then(data => {
    console.log(data);
  });