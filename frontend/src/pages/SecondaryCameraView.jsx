import {useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import SecondaryCamera from '../components/SecondaryCamera';

function SecondaryCameraView()
{
    const [searchParams]=useSearchParams();
    const code=searchParams.get('code');

    useEffect(() =>
    {
        if (!code)
        {
            alert('Invalid connection code');
            return;
        }

        // Prevent device from sleeping
        if ('wakeLock' in navigator)
        {
            navigator.wakeLock.request('screen').catch(err =>
            {
                console.warn('Wake lock failed:', err);
            });
        }
    }, [code]);

    if (!code)
    {
        return (
            <div style={{padding: '20px', textAlign: 'center'}}>
                <h2>Invalid Connection</h2>
                <p>Please scan the QR code from the interview screen.</p>
            </div>
        );
    }

    return <SecondaryCamera isPhone={true} />;
}

export default SecondaryCameraView;
