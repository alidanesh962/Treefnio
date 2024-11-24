declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      setR2L: (value: boolean) => void;
    }
  }